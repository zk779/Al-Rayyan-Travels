"use client";

import BackToServices from "../components/BackToServices";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../shadcn/components/ui/card";
import SalesTabComponent from "../components/SalesTabComponent";
import RefundTabComponent from "../components/RefundTabComponent";
import VoidTabComponent from "../components/VoidTabComponent";

// Each option on the Services landing page opens one of these: the same form as before,
// under its own title with a way back to the options.
function ServicePage({ title, description, children }) {
  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <BackToServices />
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

export function NewSalePage() {
  return (
    <ServicePage title="New Sale" description="Issue a ticket or service to a customer">
      <SalesTabComponent />
    </ServicePage>
  );
}

export function NewRefundPage() {
  return (
    <ServicePage title="Sale Refund" description="Refund an existing sale">
      <RefundTabComponent />
    </ServicePage>
  );
}

export function NewVoidPage() {
  return (
    <ServicePage title="Void Sale" description="Record a ticket cancelled with the vendor">
      <VoidTabComponent />
    </ServicePage>
  );
}
