"use client";

import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
            <Link
              to="/new-services"
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              Services
            </Link>
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
