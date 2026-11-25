"use client";

import InsuranceBookingForm from "../components/InsuranceBookingForm";
import BackToServices from "../components/BackToServices";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "../../shadcn/components/ui/card";

export default function NewInsurance() {
  const { hasPermission } = useAuth();

  if (!hasPermission("INSURANCE_CREATE")) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          You don't have permission to create insurance policies.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-end">
        <BackToServices />
      </div>
      <InsuranceBookingForm />
    </div>
  );
}
