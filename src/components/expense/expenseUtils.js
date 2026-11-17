// Shared pieces of the Expense page: the lists, the VAT maths (display only — the server works the
// VAT out again and is the one that saves it) and how a form becomes a request.

export const CATEGORIES = [
  { value: "COMPANY_EXPENSE", label: "Company Expense" },
  { value: "OFFICE_SUPPLIES", label: "Office Supplies" },
  { value: "SALARY", label: "Salary" },
  { value: "TRAVEL", label: "Travel" },
  { value: "MARKETING", label: "Marketing" },
  { value: "MEALS", label: "Meals" },
  { value: "TRAINING", label: "Training" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "RENT", label: "Rent" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "RETURNABLE_VAT", label: "Returnable VAT %" },
  { value: "OTHER", label: "Other" },
];
export const STATUSES = [
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];
export const catLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

export const RETURNABLE_VAT = "RETURNABLE_VAT";
export const money2 = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// the receipt: same formats / size as the payments' attachment
export const ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf";
export const MAX_FILE_MB = 10;
export const fileProblem = (file) => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["jpg", "jpeg", "png", "webp", "pdf"].includes(ext)) return `Unsupported file type${ext ? ` ".${ext}"` : ""}. Allowed: jpg, jpeg, png, webp, pdf`;
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `The file is bigger than ${MAX_FILE_MB} MB`;
  return null;
};
export const isPdf = (url) => /\.pdf($|\?)/i.test(String(url || ""));
export const fileNameOf = (url) => String(url || "").split("/").pop()?.split("?")[0] || "attachment";
export const sizeLabel = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(Math.round(bytes / 1024), 1)} KB`);

/**
 * VAT of an amount that was ENTERED on the form, in whole halalas (the same rule as the server):
 *   INCLUSIVE — the amount already contains the 15% VAT
 *   EXCLUSIVE — 15% is added on top
 *   null      — no VAT
 * `gross` is what is actually paid.
 */
export const vatBreakdown = (entered, mode) => {
  const cents = Math.round(Number(entered || 0) * 100);
  if (!mode) return { net: cents / 100, vat: 0, gross: cents / 100 };
  const vatCents = mode === "INCLUSIVE" ? Math.round((cents * 15) / 115) : Math.round((cents * 15) / 100);
  const gross = mode === "INCLUSIVE" ? cents : cents + vatCents;
  return { net: (gross - vatCents) / 100, vat: vatCents / 100, gross: gross / 100 };
};

/** The VAT type of a saved expense (an older "Returnable VAT" row has none saved: it is inclusive). */
export const savedVatMode = (e) => e.vatMode || (e.category === RETURNABLE_VAT ? "INCLUSIVE" : null);

export const newDetail = () => ({ id: crypto.randomUUID(), label: "", value: "" });

export const emptyForm = () => ({
  expenseDate: new Date(),
  category: "",
  branchId: "",
  amount: "",
  hasVat: false,
  vatMode: "INCLUSIVE",
  status: "APPROVED",
  paymentMode: "CASH",
  bankId: "",
  userId: "",
  description: "",
  details: [{ ...newDetail(), label: "Service Name" }],
});

/** A saved expense -> the form. For an EXCLUSIVE-VAT expense the form shows the amount before VAT (what was typed). */
export const formFromExpense = (e) => {
  const mode = savedVatMode(e);
  const entered = mode === "EXCLUSIVE" && e.vatAmount != null ? Math.round((Number(e.amount) - Number(e.vatAmount)) * 100) / 100 : Number(e.amount);
  return {
    expenseDate: new Date(e.expenseDate),
    category: e.category,
    branchId: e.branchId,
    amount: String(entered),
    hasVat: !!mode,
    vatMode: mode || "INCLUSIVE",
    status: e.status,
    paymentMode: e.paymentMode,
    bankId: e.bankId ?? "",
    userId: e.userId ?? "",
    description: e.description ?? "",
    details: (e.details || []).length ? e.details.map((d) => ({ id: crypto.randomUUID(), label: d.label, value: d.value })) : [{ ...newDetail(), label: "Service Name" }],
  };
};

/** The request body (multipart, so the receipt can travel with it). */
export const buildFormData = (form, { file, removeAttachment }) => {
  const fd = new FormData();
  fd.append("expenseDate", form.expenseDate.toISOString());
  fd.append("category", form.category);
  fd.append("branchId", form.branchId);
  fd.append("amount", String(Number(form.amount)));
  fd.append("status", form.status);
  fd.append("paymentMode", form.paymentMode);
  fd.append("bankId", form.paymentMode === "BANK_TRANSFER" ? form.bankId : "");
  fd.append("userId", form.category === "SALARY" ? form.userId : "");
  // the returnable-VAT category always carries (inclusive) VAT; otherwise it is the toggle
  const mode = form.category === RETURNABLE_VAT ? "INCLUSIVE" : form.hasVat ? form.vatMode : "";
  fd.append("vatMode", mode);
  fd.append("description", form.description || "");
  fd.append(
    "details",
    JSON.stringify(form.details.filter((d) => d.label.trim() && d.value.trim()).map((d) => ({ label: d.label.trim(), value: d.value.trim() }))),
  );
  if (file) fd.append("attachment", file, file.name);
  else if (removeAttachment) fd.append("removeAttachment", "true");
  return fd;
};
