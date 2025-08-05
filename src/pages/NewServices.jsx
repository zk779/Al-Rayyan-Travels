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
import SalesTabComponent from "../components/SalesTabComponent"; // Nested SalesTabComponent
import RefundTabComponent from "../components/RefundTabComponent"; // Nested RefundTabComponent
import DepositTabComponent from "../components/DepositTabComponent"; // Nested DepositTabComponent

export default function NewSaleComponent() {
  const [activeTab, setActiveTab] = useState("new-sale");

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl gap-2">
            Sales Services
          </CardTitle>
          <CardDescription>
            Add new sales, process refunds, and handle deposits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="new-sale">New Sale</TabsTrigger>
              <TabsTrigger value="refund">Refund</TabsTrigger>
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
            </TabsList>

            {/* New Sale Tab */}
            <TabsContent value="new-sale">
              <SalesTabComponent />
            </TabsContent>

            {/* Refund Tab */}
            <TabsContent value="refund">
              <RefundTabComponent />
            </TabsContent>

            {/* Deposit Tab */}
            <TabsContent value="deposit">
              <DepositTabComponent />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
