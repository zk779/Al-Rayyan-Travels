"use client";

import HotelBookingForm from "../components/HotelBookingForm";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "../../shadcn/components/ui/card";

export default function NewHotelBooking() {
  const { hasPermission } = useAuth();

  if (!hasPermission("SALE_CREATE")) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          You don't have permission to create hotel bookings.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <HotelBookingForm />
    </div>
  );
}
