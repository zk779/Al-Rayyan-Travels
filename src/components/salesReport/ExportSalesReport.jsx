"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, FileSpreadsheet } from "lucide-react";

import { Button } from "../../../shadcn/components/ui/button";
import { Checkbox } from "../../../shadcn/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../shadcn/components/ui/dialog";
import { tabbyFromNet } from "../paymentBreakdown";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Every exportable column, grouped for the checkbox list. `get` pulls the
// display value out of a sale row (plus the customer-type maps, needed only
// for the Tabby/Tamara group); everything else falls back to `sale[key]`.
const FIELD_GROUPS = [
  {
    group: "Basic Info",
    fields: [
      { key: "date", label: "Date", get: (s) => (s.date ? format(new Date(s.date), "yyyy-MM-dd") : "") },
      { key: "invoiceNo", label: "Invoice #" },
      { key: "documentNo", label: "Document #" },
      { key: "pnr", label: "PNR" },
      { key: "paxName", label: "Passenger Name" },
      { key: "airlineCode", label: "Airline Code" },
      { key: "airlineName", label: "Airline Name" },
    ],
  },
  {
    group: "Vendor",
    fields: [
      { key: "vendorName", label: "Vendor" },
      { key: "vendorCategory", label: "Vendor Category" },
      { key: "vendorBalance", label: "Vendor Balance", money: true },
    ],
  },
  {
    group: "Customer",
    fields: [
      { key: "customerName", label: "Customer", get: (s) => s.customerName || "Walk-in" },
      { key: "customerPhone", label: "Customer Phone" },
      { key: "customerBalance", label: "Customer Balance", money: true },
    ],
  },
  {
    group: "Payment",
    fields: [
      { key: "paymentType", label: "Payment Type" },
      { key: "paymentStatus", label: "Payment Status" },
      {
        key: "paymentLegs",
        label: "Split Payment Breakdown",
        get: (s) =>
          (s.paymentLegs || [])
            .map((l) => {
              const bits = [`${l.method}: ${Number(l.amount || 0).toFixed(2)}`];
              if (l.bankName) bits.push(l.bankName);
              if (l.customerName) bits.push(l.customerName);
              return bits.join(" — ");
            })
            .join(" | "),
      },
      { key: "bankName", label: "Bank" },
    ],
  },
  {
    group: "Financials",
    fields: [
      { key: "netPrice", label: "Net Price", money: true },
      { key: "sellPrice", label: "Sell Price", money: true },
      { key: "profit", label: "Profit", money: true },
      { key: "paidAmount", label: "Paid Amount", money: true },
      { key: "dueAmount", label: "Due Amount", money: true },
    ],
  },
  {
    group: "Status & Meta",
    fields: [
      { key: "status", label: "Status" },
      { key: "remarks", label: "Remarks" },
      { key: "createdByName", label: "Agent" },
      { key: "branchName", label: "Branch" },
    ],
  },
  {
    group: "Refund Details",
    fields: [
      { key: "refundStatus", label: "Refund Status", get: (s) => s.refund?.status || "" },
      {
        key: "refundDate",
        label: "Refund Date",
        get: (s) => (s.refund?.refundDate ? format(new Date(s.refund.refundDate), "yyyy-MM-dd") : ""),
      },
      {
        key: "netRefundToCustomer",
        label: "Net Refund to Customer",
        get: (s) => moneyOrBlank(s.refund?.netRefundToCustomer),
      },
      {
        key: "vendorRefundAmount",
        label: "Vendor Refund Amount",
        get: (s) => moneyOrBlank(s.refund?.vendorRefundAmount),
      },
      { key: "refundFee", label: "Refund Fee", get: (s) => moneyOrBlank(s.refund?.refundFee) },
      {
        key: "cancellationCharges",
        label: "Cancellation Charges",
        get: (s) => moneyOrBlank(s.refund?.cancellationCharges),
      },
      { key: "refundReason", label: "Refund Reason", get: (s) => s.refund?.refundReason || "" },
    ],
  },
  {
    group: "Tabby / Tamara Details",
    fields: [
      { key: "tabbyOrderAmount", label: "Order Amount", get: (s, m) => tabbyValue(s, m, "orderAmount") },
      { key: "tabbyTotalDeduction", label: "Fee + VAT Deducted", get: (s, m) => tabbyValue(s, m, "totalDeduction") },
      { key: "tabbyVat", label: "VAT (15%)", get: (s, m) => tabbyValue(s, m, "vat") },
      { key: "tabbyNetAmount", label: "Net Settlement Amount", get: (s, m) => tabbyValue(s, m, "netAmount") },
    ],
  },
];

// Sensible default selection — mirrors what the old plain CSV export showed.
const DEFAULT_KEYS = new Set([
  "date", "invoiceNo", "airlineCode", "documentNo", "vendorName", "customerName",
  "createdByName", "paymentType", "paymentStatus", "sellPrice", "status", "remarks",
]);

const ALL_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields);

const moneyOrBlank = (v) => (v == null ? "" : Number(v).toFixed(2));

const isRefundedRow = (sale) => sale.status?.toUpperCase() === "REFUNDED" || !!sale.refund;

// Resolves the Tabby/Tamara breakdown for a row, whether it's a plain CREDIT
// sale (net amount lives in sellPrice) or a PARTIAL sale with a CREDIT leg
// (net amount lives on that leg). Returns null when the row isn't Tabby/Tamara.
function tabbyBreakdown(sale, { typeById, typeByName }) {
  const pt = String(sale.paymentType || "").toUpperCase();
  if (pt === "CREDIT" && typeById.get(sale.customerId) === "TABBY_OR_TAMARA") {
    return tabbyFromNet(sale.sellPrice);
  }
  if (pt === "PARTIAL") {
    const creditLeg = (sale.paymentLegs || []).find(
      (l) => String(l.method).toUpperCase() === "CREDIT" && typeByName.get(l.customerName) === "TABBY_OR_TAMARA",
    );
    if (creditLeg) return tabbyFromNet(creditLeg.amount);
  }
  return null;
}

function tabbyValue(sale, maps, field) {
  const t = tabbyBreakdown(sale, maps);
  return t ? t[field].toFixed(2) : "";
}

function resolveCell(field, sale, maps) {
  if (field.get) return field.get(sale, maps);
  const raw = sale[field.key];
  if (field.money) return raw == null ? "" : Number(raw).toFixed(2);
  return raw ?? "";
}

async function buildWorkbook(sales, selectedKeys, maps) {
  // Loaded on demand — exceljs is a large dependency, only needed once
  // someone actually exports, not on every page load.
  const { default: ExcelJS } = await import("exceljs");
  const columns = ALL_FIELDS.filter((f) => selectedKeys.has(f.key));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sales Report");
  ws.columns = columns.map((f) => ({ header: f.label, key: f.key, width: 20 }));

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };

  sales.forEach((sale) => {
    const rowData = {};
    columns.forEach((f) => {
      rowData[f.key] = resolveCell(f, sale, maps);
    });
    const row = ws.addRow(rowData);
    if (isRefundedRow(sale)) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCA5A5" } };
      });
    }
  });

  return wb;
}

async function downloadWorkbook(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function ExportSalesReport({ sales = [], disabled }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState(new Set(DEFAULT_KEYS));
  const [customers, setCustomers] = useState([]);

  // Only needed to detect Tabby/Tamara customers — fetched lazily, once,
  // the first time the dialog opens (not every render of the page).
  useEffect(() => {
    if (!open || customers.length) return;
    fetch(`${API_BASE}/api/customers`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => j.success && setCustomers(j.data || []))
      .catch(() => {});
  }, [open, customers.length]);

  const maps = useMemo(() => {
    const typeById = new Map(customers.map((c) => [c.id, c.customerType]));
    const typeByName = new Map(customers.map((c) => [c.customerName, c.customerType]));
    return { typeById, typeByName };
  }, [customers]);

  const toggleField = (key) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleGroup = (fields, checkAll) =>
    setSelected((prev) => {
      const next = new Set(prev);
      fields.forEach((f) => (checkAll ? next.add(f.key) : next.delete(f.key)));
      return next;
    });

  const selectAll = () => setSelected(new Set(ALL_FIELDS.map((f) => f.key)));
  const clearAll = () => setSelected(new Set());

  const handleExport = async () => {
    if (!selected.size || !sales.length) return;
    setExporting(true);
    try {
      const wb = await buildWorkbook(sales, selected, maps);
      await downloadWorkbook(wb, `sales-report-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`);
      setOpen(false);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={disabled} className="gap-2">
        <Download className="h-4 w-4" /> Export Report
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Export Sales Report
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-slate-500 -mt-2">
            Choose which columns to include. Refunded sales are highlighted in
            red; Tabby/Tamara credit sales include a fee breakdown when that
            group is selected.
          </p>

          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-sm text-slate-500">
              {selected.size} of {ALL_FIELDS.length} columns selected
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear all
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {FIELD_GROUPS.map(({ group, fields }) => {
              const allChecked = fields.every((f) => selected.has(f.key));
              const someChecked = fields.some((f) => selected.has(f.key));
              return (
                <div key={group}>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2 cursor-pointer">
                    <Checkbox
                      checked={allChecked ? true : someChecked ? "indeterminate" : false}
                      onCheckedChange={(v) => toggleGroup(fields, !!v)}
                    />
                    {group}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 pl-6">
                    {fields.map((f) => (
                      <label key={f.key} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <Checkbox checked={selected.has(f.key)} onCheckedChange={() => toggleField(f.key)} />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting || !selected.size} className="gap-2">
              {exporting ? "Exporting..." : <><Download className="h-4 w-4" /> Export .xlsx</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
