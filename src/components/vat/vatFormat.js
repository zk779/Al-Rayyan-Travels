// Same bilingual company letterhead used on the invoice pages — the printed
// VAT reports carry it exactly the same way.
export const companyData = {
  name: "AlMadaar Limited Company",
  nameArabic: "شركة المدار ليميتد",
  trn: "314713818300003",
  trnArabic: "٣١٤٧١٣٨١٨٣٠٠٠٠٣",
  crNumber: "7053982455",
  crNumberArabic: "٧٠٥٣٩٨٢٤٥٥",
  address:
    "GGDC6349, Al Mutalla Street 3140, Ar Rawdah Distt, Building No. 6349, Jazan, Kingdom of Saudi Arabia",
  addressArabic:
    "GGDC6349, شارع المطلعة 3140, حي الروضة مبنى رقم 6349, جازان, المملكة العربية السعودية",
  phone: "+966 17 3226260",
  phoneArabic: "+٩٦٦ ١٧ ٣٢٢٦٢٦٠",
  email: "agency@al-madaar.com",
  website: "www.al-madaar.com",
};

export const money = (v) =>
  (Number(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
