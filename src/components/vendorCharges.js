// A sale's net price is what the vendor bills us, worked out from the vendor's invoice:
//
//   Basic fare (typed WITHOUT VAT)
// + PAX VAT      15% of the basic fare — domestic routes only
// + Vendor charges (typed)
// + VAT on those charges (15%)
// − Discount      what the vendor takes off
// = Net price     (this is what the vendor ledger, profit and the reports use)
//
// The VAT is always worked out on the whole amount BEFORE the discount (e.g. 409.30 + 5.00 → VAT 62.15
// whatever the discount is). The sale keeps the net price (so the vendor ledger, profit and every report
// work as before) and also stores the charges, their VAT and the discount so the breakdown can be shown
// again when it is edited.
const VAT_RATE = 0.15;
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const num = (v) => Number(v) || 0;

/** 15% VAT on the vendor service charges, as a number. */
export const vendorVatOf = (charges) => r2(num(charges) * VAT_RATE);

/** 15% of an amount in whole halalas (409.30 → 61.40), the way the invoice rounds it. */
export const vat15 = (amount) => Math.round((Math.round(num(amount) * 100) * 15) / 100) / 100;

/** PAX VAT (domestic): 15% ON TOP of the basic fare. */
export const paxVatOf = (baseNet) => (num(baseNet) > 0 ? vat15(baseNet) : 0);

export const isDomestic = (routeType) => String(routeType || "").toUpperCase() === "DOMESTIC";

/**
 * The net price as the string the forms keep ("" until a basic fare is typed, and "" when the discount
 * would take it to nothing).
 */
export const netTotalOf = ({ baseNet, vendorServiceCharge, discount, routeType }) => {
  if (baseNet === "" || baseNet == null) return "";
  const pax = isDomestic(routeType) ? paxVatOf(baseNet) : 0;
  const net = r2(num(baseNet) + pax + num(vendorServiceCharge) + vendorVatOf(vendorServiceCharge) - num(discount));
  return net > 0 ? String(net) : "";
};

/**
 * The form keeps `baseNet` (basic fare), `vendorServiceCharge` and `discount` (typed) next to the
 * `netPrice` it works with everywhere else, plus the two VATs. Returns the fields to merge into a row
 * after one of the typed parts changed — or after the route changed (call with field = null).
 */
export const applyVendorParts = (item, field, value) => {
  const pick = (key) => (field === key ? value : item[key] ?? "");
  const baseNet = pick("baseNet");
  const vendorServiceCharge = pick("vendorServiceCharge");
  const discount = pick("discount");
  const dom = isDomestic(item.routeType);
  return {
    baseNet,
    vendorServiceCharge,
    discount,
    vendorVat: num(vendorServiceCharge) > 0 ? vendorVatOf(vendorServiceCharge).toFixed(2) : "",
    paxVat: dom ? (num(baseNet) > 0 ? paxVatOf(baseNet).toFixed(2) : "") : "",
    netPrice: netTotalOf({ baseNet, vendorServiceCharge, discount, routeType: item.routeType }),
  };
};

export const isVendorPart = (field) => field === "baseNet" || field === "vendorServiceCharge" || field === "discount";

/** Rows loaded from the server: split the saved net price back into basic fare + VATs + charges + discount. */
export const withVendorParts = (sale) => {
  const charges = num(sale.vendorServiceCharge);
  const vat = num(sale.vendorVat) || vendorVatOf(charges);
  const discount = num(sale.discount);
  const pax = isDomestic(sale.routeType) ? num(sale.paxVat) : 0;
  return {
    ...sale,
    vendorServiceCharge: charges ? String(charges) : "",
    vendorVat: charges ? vat.toFixed(2) : "",
    discount: discount ? String(discount) : "",
    baseNet: sale.netPrice == null || sale.netPrice === "" ? "" : String(r2(num(sale.netPrice) + discount - charges - vat - pax)),
  };
};

/** What the sale payloads send besides netPrice. */
export const vendorChargesPayload = (s) => ({
  vendorServiceCharge: num(s.vendorServiceCharge),
  vendorVat: num(s.vendorServiceCharge) > 0 ? vendorVatOf(s.vendorServiceCharge) : 0,
  discount: num(s.discount),
});
