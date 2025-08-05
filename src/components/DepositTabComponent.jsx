import { useState } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Search } from "lucide-react"; // Import Search icon

export default function DepositTabComponent() {
  const [depositForm, setDepositForm] = useState({
    documentNumber: "",
    netPrice: "",
    remarks: "",
  });

  const [amountToPay, setAmountToPay] = useState("0.00"); // State for amount to pay

  const handleSearch = () => {
    // Simulate a deposit search (replace with actual logic)
    console.log(
      "Searching for deposit with document number:",
      depositForm.documentNumber
    );

    // Mock the result
    setDepositForm((prev) => ({
      ...prev,
      netPrice: "180.00",
    }));

    // Simulate calculation
    calculateAmountToPay("180.00");
  };

  const calculateAmountToPay = (netPrice) => {
    // For now we just return the same netPrice, but this could include additional calculations
    setAmountToPay(netPrice);
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setDepositForm((prev) => {
      const updatedForm = { ...prev, [field]: value };
      // Recalculate the amount to pay on netPrice change
      if (field === "netPrice") {
        calculateAmountToPay(value);
      }
      return updatedForm;
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter document number to search"
          value={depositForm.documentNumber}
          onChange={(e) =>
            setDepositForm((prev) => ({
              ...prev,
              documentNumber: e.target.value,
            }))
          }
        />
        <Button variant="outline" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Deposit Form */}
      <div className="max-w-md mx-auto space-y-4">
        {/* Net Price Section */}
        <div className="space-y-2">
          <Label>Net Price (To Pay Supplier)</Label>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-700">Amount to Pay:</span>
              <span className="text-lg font-semibold text-orange-800">
                ${amountToPay || "0.00"}
              </span>
            </div>
          </div>
        </div>

        {/* Remarks Section */}
        <div className="space-y-2">
          <Label htmlFor="depositRemarks">Remarks</Label>
          <Textarea
            id="depositRemarks"
            placeholder="Enter deposit remarks..."
            value={depositForm.remarks}
            onChange={(e) =>
              setDepositForm((prev) => ({ ...prev, remarks: e.target.value }))
            }
          />
        </div>

        {/* Process Deposit Button */}
        <Button className="w-full bg-gradient-primary text-white" size="lg" variant="secondary">
          Process Deposit Payment
        </Button>
      </div>
    </div>
  );
}
