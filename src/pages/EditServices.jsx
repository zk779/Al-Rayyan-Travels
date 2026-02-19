"use client";

import { useState } from "react";
import { useParams } from "react-router-dom";
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

import EditSalesTab from "../components/EditSaleTab";

export default function EditSaleComponent() {
  const { saleId } = useParams(); // This could be the Invoice ID or Sale ID depending on your routing
  const [activeTab, setActiveTab] = useState("sales");

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Services</CardTitle>
          <CardDescription>
            Update existing sales transactions or modify processed refunds
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="sales">Edit Sale</TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="mt-6">
              {/* This component will now handle its own fetch/update logic using saleId */}
              <EditSalesTab saleId={saleId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}