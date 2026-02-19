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

export default function NewSaleComponent() {
  const [activeTab, setActiveTab] = useState("new-sale");

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sales Services</CardTitle>
          <CardDescription>
            Manage sales transactions and refund processing
          </CardDescription>
        </CardHeader>

        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}