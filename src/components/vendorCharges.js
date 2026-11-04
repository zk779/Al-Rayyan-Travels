// A sale's net price is what the vendor bills us: the net amount + the vendor's own service
// charges + the 15% VAT on those charges. The sale keeps that sum as netPrice (so the vendor
// ledger, profit and every report work exactly as before) and also stores the charges and
// their VAT so the breakdown can be shown again when it is edited.
const VAT_RATE = 0.15;
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const num = (v) => Number(v) || 0;

/** 15% VAT on the vendor service charges, as a number. */
export const vendorVatOf = (charges) => r2(num(charges) * VAT_RATE);

/** net amount + charges + VAT, as the string the forms keep ("" until a net amount is typed). */
export const netTotalOf = (baseNet, charges) =>
  baseNet === "" || baseNet == null ? "" : String(r2(num(baseNet) + num(charges) + vendorVatOf(charges)));

/**
 * The form keeps `baseNet` (the net amount typed) and `vendorServiceCharge` (typed) next to the
 * `netPrice` it works with everywhere else (their sum, with the VAT). Returns the fields to merge
 * into a row after one of the two parts changed.
 */
export const applyVendorParts = (item, field, value) => {
  const baseNet = field === "baseNet" ? value : item.baseNet ?? "";
  const vendorServiceCharge = field === "vendorServiceCharge" ? value : item.vendorServiceCharge ?? "";
  return {
    baseNet,
    vendorServiceCharge,
    vendorVat: num(vendorServiceCharge) > 0 ? vendorVatOf(vendorServiceCharge).toFixed(2) : "",
    netPrice: netTotalOf(baseNet, vendorServiceCharge),
  };
};

export const isVendorPart = (field) => field === "baseNet" || field === "vendorServiceCharge";

/** The net the PAX VAT is taken from: the ticket's own net, not the vendor's service charges. */
export const fareNet = (item) => (item.baseNet !== undefined && item.baseNet !== "" ? item.baseNet : item.netPrice);

/** Rows loaded from the server: split the saved net price back into net amount + charges + VAT. */
export const withVendorParts = (sale) => {
  const charges = num(sale.vendorServiceCharge);
  const vat = num(sale.vendorVat) || vendorVatOf(charges);
  return {
    ...sale,
    vendorServiceCharge: charges ? String(charges) : "",
    vendorVat: charges ? vat.toFixed(2) : "",
    baseNet: sale.netPrice == null || sale.netPrice === "" ? "" : String(r2(num(sale.netPrice) - charges - vat)),
  };
};

/** What the sale payloads send besides netPrice. */
export const vendorChargesPayload = (s) => ({
  vendorServiceCharge: num(s.vendorServiceCharge),
  vendorVat: num(s.vendorServiceCharge) > 0 ? vendorVatOf(s.vendorServiceCharge) : 0,
});
