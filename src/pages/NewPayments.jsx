"use client";

import { useState } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Textarea } from "../../shadcn/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import { Badge } from "../../shadcn/components/ui/badge";
import { Separator } from "../../shadcn/components/ui/separator";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import {
  Search,
  Upload,
  CalendarIcon,
  Plane,
  User,
  CreditCard,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../shadcn/lib/utils";
import SlideButton from "../../shadcn/components/ui/slide-button";

// Mock data for demonstration
const mockTicketData = {
  INV001: {
    airline: "Emirates",
    vendorName: "Al Rayyan Travel Supplier",
    buyingPrice: 850.0,
    salePrice: 1200.0,
    passenger: "John Smith",
    route: "DXB - LHR",
    travelDate: "2024-01-15",
    ticketNumber: "EK-123456789",
    pnr: "ABC123",
  },
  INV002: {
    airline: "Qatar Airways",
    vendorName: "Qatar Travel Partners",
    buyingPrice: 920.0,
    salePrice: 1350.0,
    passenger: "Sarah Johnson",
    route: "DOH - JFK",
    travelDate: "2024-01-20",
    ticketNumber: "QR-987654321",
    pnr: "XYZ789",
  },
};

export default function DepositTabComponent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [depositType, setDepositType] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [ticketDetails, setTicketDetails] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [receipt, setReceipt] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDepositTypeSelect = (type) => {
    setDepositType(type);
    setCurrentStep(2);
  };

  const handleSearch = async () => {
    if (!invoiceNumber.trim()) return;

    setIsSearching(true);

    // Simulate API call
    setTimeout(() => {
      const ticket = mockTicketData[invoiceNumber];
      if (ticket) {
        setTicketDetails(ticket);
        setCurrentStep(3);
      } else {
        alert("Invoice not found. Try INV001 or INV002");
      }
      setIsSearching(false);
    }, 1000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceipt(file);
    }
  };

  const handleMakePayment = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      // alert("Payment processed successfully!");
      // Reset form
      // setCurrentStep(1);
      // setDepositType("");
      // setInvoiceNumber("");
      // setTicketDetails(null);
      // setReceipt(null);
      // setRemarks("");
      setIsProcessing(false);
    }, 3000);
  };

  const getPaymentAmount = () => {
    if (!ticketDetails) return 0;
    return depositType === "vendor"
      ? ticketDetails.buyingPrice
      : ticketDetails.salePrice;
  };

  const resetForm = () => {
    setCurrentStep(1);
    setDepositType("");
    setInvoiceNumber("");
    setTicketDetails(null);
    setReceipt(null);
    setRemarks("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div
          className={cn(
            "flex items-center space-x-2",
            currentStep >= 1 ? "text-blue-600" : "text-gray-400"
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
            )}
          >
            1
          </div>
          <span className="text-sm font-medium">Select Type</span>
        </div>
        <div
          className={cn(
            "w-8 h-1",
            currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
          )}
        />
        <div
          className={cn(
            "flex items-center space-x-2",
            currentStep >= 2 ? "text-blue-600" : "text-gray-400"
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
            )}
          >
            2
          </div>
          <span className="text-sm font-medium">Search Invoice</span>
        </div>
        <div
          className={cn(
            "w-8 h-1",
            currentStep >= 3 ? "bg-blue-600" : "bg-gray-200"
          )}
        />
        <div
          className={cn(
            "flex items-center space-x-2",
            currentStep >= 3 ? "text-blue-600" : "text-gray-400"
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              currentStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"
            )}
          >
            3
          </div>
          <span className="text-sm font-medium">Make Payment</span>
        </div>
      </div>

      {/* Step 1: Select Deposit Type */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Select Deposit Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300 bg-transparent"
                onClick={() => handleDepositTypeSelect("vendor")}
              >
                <User className="h-8 w-8 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold">Vendor Payment</div>
                  <div className="text-sm text-gray-500">Pay to suppliers</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-300 bg-transparent"
                onClick={() => handleDepositTypeSelect("customer")}
              >
                <CreditCard className="h-8 w-8 text-green-600" />
                <div className="text-center">
                  <div className="font-semibold">Customer Payment</div>
                  <div className="text-sm text-gray-500">
                    Receive from customers
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Search Invoice */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Invoice
              <Badge
                variant={depositType === "vendor" ? "default" : "secondary"}
              >
                {depositType === "vendor"
                  ? "Vendor Payment"
                  : "Customer Payment"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter invoice number (try INV001 or INV002)"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !invoiceNumber.trim()}
              >
                {isSearching ? "Searching..." : <Search className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Ticket Details & Payment */}
      {currentStep === 3 && ticketDetails && (
        <div className="space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Ticket Details
                <Badge
                  variant={depositType === "vendor" ? "default" : "secondary"}
                >
                  {depositType === "vendor"
                    ? "Vendor Payment"
                    : "Customer Payment"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Airline
                    </Label>
                    <p className="text-lg font-semibold">
                      {ticketDetails.airline}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Vendor Name
                    </Label>
                    <p className="text-lg">{ticketDetails.vendorName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Passenger
                    </Label>
                    <p className="text-lg">{ticketDetails.passenger}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Route
                    </Label>
                    <p className="text-lg">{ticketDetails.route}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Travel Date
                    </Label>
                    <p className="text-lg">{ticketDetails.travelDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Ticket Number
                    </Label>
                    <p className="text-lg font-mono">
                      {ticketDetails.ticketNumber}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Payment Amount */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-blue-700">
                      {depositType === "vendor"
                        ? "Buying Price (To Pay Supplier)"
                        : "Sale Price (To Receive)"}
                    </Label>
                    <p className="text-sm text-blue-600 mt-1">
                      {depositType === "vendor"
                        ? "Amount to pay to vendor"
                        : "Amount to receive from customer"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-800">
                      ${getPaymentAmount().toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Date */}
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !paymentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDate ? (
                        format(paymentDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={setPaymentDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Receipt Upload */}
              <div className="space-y-2">
                <Label>Upload Receipt</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {receipt && (
                  <p className="text-sm text-green-600">
                    ✓ {receipt.name} uploaded
                  </p>
                )}
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  placeholder="Enter payment remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex w-full gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 w-1/2"
                >
                  Back to Search
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 w-1/2"
                >
                  Reset
                </Button>
              </div>
              <div className="flex w-full gap-3 justify-center">
                <SlideButton
                  handlePayment={handleMakePayment}
                  disabled={isProcessing}
                  price={850}
                  isProcessing={isProcessing}
                  className="flex-1 bg-gradient-primary hover:from-blue-700 hover:to-indigo-700"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
