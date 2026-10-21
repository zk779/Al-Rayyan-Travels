"use client";

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../shadcn/components/ui/button";
import HotelBookingForm from "../components/HotelBookingForm";

export default function EditHotelBooking() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-end">
        {/* Returns to wherever this was opened from (e.g. Sales Report with its filters intact) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="group gap-2 rounded-xl border-slate-200 bg-white px-3.5 py-2 text-slate-600 shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span className="font-medium">Go Back</span>
        </Button>
      </div>
      <HotelBookingForm invoiceId={invoiceId} />
    </div>
  );
}
