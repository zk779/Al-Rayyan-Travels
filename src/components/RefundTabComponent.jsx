import { useState, useEffect } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcn/components/ui/select";
import { Label } from "../../shadcn/components/ui/label";
import { Separator } from "../../shadcn/components/ui/separator";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Badge } from "../../shadcn/components/ui/badge";
import { Search } from "lucide-react";

export default function RefundTabComponent() {
  const [refundForm, setRefundForm] = useState({
    documentNumber: "",
    airline: "",
    vendor: "",
    netPrice: "",
    refundFee: "",
    serviceCharges: "",
    remarks: "",
  });

  const [refundPax, setRefundPax] = useState("0.00");

  const mockAirlines = [
    { code: "AA", name: "American Airlines" },
    { code: "BA", name: "British Airways" },
    { code: "EK", name: "Emirates" },
    { code: "LH", name: "Lufthansa" },
    { code: "QR", name: "Qatar Airways" },
  ];

  const mockVendors = [
    { id: "1", name: "Global Travel Solutions" },
    { id: "2", name: "Sky High Bookings" },
    { id: "3", name: "Premier Travel Partners" },
    { id: "4", name: "Elite Airways Distribution" },
  ];

  const handleSearch = () => {
    console.log("Searching for document:", refundForm.documentNumber);
    setRefundForm((prev) => ({
      ...prev,
      airline: "AA",
      vendor: "1",
      netPrice: "250.00",
    }));
  };

  const calculateRefundPax = (form) => {
    const netPrice = parseFloat(form.netPrice) || 0;
    const refundFee = parseFloat(form.refundFee) || 0;
    const serviceCharges = parseFloat(form.serviceCharges) || 0;
    const calculatedRefundPax = netPrice - refundFee - serviceCharges;
    setRefundPax(
      calculatedRefundPax >= 0 ? calculatedRefundPax.toFixed(2) : "0.00"
    );
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setRefundForm((prev) => {
      const updatedForm = { ...prev, [field]: value };
      calculateRefundPax(updatedForm);
      return updatedForm;
    });
  };

  useEffect(() => {
    calculateRefundPax(refundForm);
  }, [refundForm.netPrice]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter document number to search"
          value={refundForm.documentNumber}
          onChange={(e) =>
            setRefundForm((prev) => ({
              ...prev,
              documentNumber: e.target.value,
            }))
          }
        />
        <Button variant="outline" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Airline Code (Selected)</Label>
            <Select value={refundForm.airline} disabled>
              <SelectTrigger>
                <SelectValue placeholder="Auto-filled after search" />
              </SelectTrigger>
              <SelectContent>
                {mockAirlines.map((airline) => (
                  <SelectItem key={airline.code} value={airline.code}>
                    <Badge variant="secondary">{airline.code}</Badge>{" "}
                    {airline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Vendor (Selected)</Label>
            <Select value={refundForm.vendor} disabled>
              <SelectTrigger>
                <SelectValue placeholder="Auto-filled after search" />
              </SelectTrigger>
              <SelectContent>
                {mockVendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Net Price (Fetched)</Label>
            <Input
              value={refundForm.netPrice}
              disabled
              className="bg-gray-50"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refundFee">Refund Fee</Label>
            <Input
              id="refundFee"
              type="number"
              placeholder="0.00"
              value={refundForm.refundFee}
              onChange={(e) => handleInputChange(e, "refundFee")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceCharges">Service Charges</Label>
            <Input
              id="serviceCharges"
              type="number"
              placeholder="0.00"
              value={refundForm.serviceCharges}
              onChange={(e) => handleInputChange(e, "serviceCharges")}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Refund PAX (Calculated)</Label>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Net Price:</span>
                  <span>${refundForm.netPrice || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refund Fee:</span>
                  <span>${refundForm.refundFee || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charges:</span>
                  <span>${refundForm.serviceCharges || "0.00"}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-blue-700">
                  <span>Refund PAX:</span>
                  <span>${refundPax}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="refundRemarks">Remarks</Label>
        <Textarea
          id="refundRemarks"
          placeholder="Enter refund remarks..."
          value={refundForm.remarks}
          onChange={(e) =>
            setRefundForm((prev) => ({
              ...prev,
              remarks: e.target.value,
            }))
          }
        />
      </div>

      <Button className="w-full" size="lg" variant="destructive">
        Process Refund
      </Button>
    </div>
  );
}
