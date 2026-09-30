"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ZATCAQRCode from "../components/ZATCAQRGenerator";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const InvoicePrint = () => {
  const saleId = useParams();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const hasCustomerInfo = customerName.trim() || customerAddress.trim();

  // Static company data
  const companyData = {
    name: "AlMadaar Limited Company",
    nameArabic: "شركة المدار ليميتد",
    trn: "314713818300003/٣١٤٧١٣٨١٨٣٠٠٠٠٣",
    crNumber: "7053982455",
    crNumberArabic: "٧٠٥٣٩٨٢٤٥٥",
    address:
      "GGDC6349, Al Mutalla Street 3140, Ar Rawdah Distt, Building No. 6349, Jazan, Kingdom of Saudi Arabia",
    addressArabic:
      "GGDC6349, شارع المطلعة 3140, حي الروضة مبنى رقم 6349, جازان, المملكة العربية السعودية",
    phone: "+966 17 3226260/+٩٦٦ ١٧ ٣٢٢٦٢٦٠",
    email: "agency@al-madaar.com",
    website: "www.al-madaar.com",
  };

  // English and Arabic are never mixed on the same line below — the
  // browser's bidi algorithm reorders label/value pairs unpredictably
  // when Latin and Arabic runs share one line (e.g. "TRN/الرقم:" would
  // visually jump around). Each bilingual field instead gets its own
  // English line and its own separate, right-aligned Arabic line.
  const splitBilingual = (str) => {
    if (!str) return ["", ""];
    const [en, ...rest] = str.split("/");
    return [en.trim(), rest.join("/").trim()];
  };
  const [trnEn, trnAr] = splitBilingual(companyData.trn);
  const [phoneEn, phoneAr] = splitBilingual(companyData.phone);

  const companyDetailRows = [
    {
      label: "Address",
      labelAr: "العنوان",
      value: companyData.address,
      valueAr: companyData.addressArabic,
      mono: false,
    },
    {
      label: "Phone",
      labelAr: "الهاتف",
      value: phoneEn,
      valueAr: phoneAr,
      mono: false,
    },
    {
      label: "Email/Website  البريد/الموقع الإلكتروني",
      // labelAr: "البريد الإلكتروني",
      value: companyData.email + " | " + companyData.website,
      // valueAr: companyData.website + " | " + companyData.email,
    },
  ];

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE}/api/sales/saleId/${saleId.saleId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch invoice data");
        }

        const result = await response.json();

        if (result.success) {
          setInvoiceData(result.data);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (saleId.saleId && token) {
      fetchInvoiceData();
    }
  }, [saleId.saleId, token]);

  // Helper function to format destinations
  const formatDestinations = (destinations) => {
    if (!destinations || destinations.length === 0) return "N/A";
    return destinations.map((d) => d.value).join(" / ");
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");
  };

  // Helper function to convert number to words
  const numberToWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    if (num === 0) return "Zero";

    const convert = (n) => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      if (n < 1000)
        return (
          ones[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 !== 0 ? " " + convert(n % 100) : "")
        );
      return "";
    };

    let integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let result = "";

    if (integerPart >= 1000) {
      result += convert(Math.floor(integerPart / 1000)) + " Thousand ";
      integerPart %= 1000;
    }

    result += convert(integerPart);

    if (decimalPart > 0) {
      result += " and " + convert(decimalPart) + " Halala";
    }

    return result.trim() + " Only";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-red-600 text-lg font-semibold mb-2">
            Error loading invoice
          </p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-600 font-medium">No invoice data found</p>
        </div>
      </div>
    );
  }

  const grossAmount = Number(invoiceData.netPrice || 0);
  const vatAmount = Number(invoiceData.vatAmount || 0);
  const serviceCharges = Number(invoiceData.profit || 0);
  const baseFare = grossAmount;
  const rowTotal = grossAmount;

  return (
    <>
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            .invoice-container {
              background: white !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }
          }
        `}
      </style>

      <div className="invoice-container min-h-screen bg-linear-to-b from-slate-100 to-slate-200 py-8">
        <div
          className="max-w-[210mm] mx-auto bg-white shadow-xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          {/* Main Content Wrapper with Padding */}
          <div className="p-8 print:p-0">
            {/* Header Section */}
            <div className=" mb-1">
              <div className="flex justify-between items-start gap-8">
                {/* Company Info — bilingual throughout */}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="text-xl font-bold text-gray-900 mb-0.5 uppercase tracking-wide justify-around">
                      <div>{companyData.name}</div>
                      <div>{companyData.nameArabic}</div>
                    </div>
                    <div className="text-xs space-y-1 bg-gray-50 p-4 border-1 border-gray-300 rounded">
                      <div className="space-y-2">
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">
                            Invoice No. / رقم الفاتورة:
                          </span>
                          <span className="font-bold text-gray-900">
                            {invoiceData.invoice?.invoiceNo || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">Date / تاريخ:</span>
                          <span className="font-semibold text-gray-900">
                            {formatDate(invoiceData.invoice?.saleDate)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">
                            Ref. No. / رقم المرجع:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {invoiceData.documentNo || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h2
                    className="text-lg font-bold text-gray-900 mb-4"
                    dir="rtl"
                  ></h2>
                  <div className="space-y-2">
                    {companyDetailRows.map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-2 gap-4 text-xs"
                      >
                        <div>
                          <div className="text-gray-500 font-bold uppercase tracking-wide text-[12px]">
                            {row.label}
                          </div>
                          <div
                            className={`text-gray-900 ${row.mono ? "font-mono" : ""}`}
                          >
                            {row.value || "—"}
                          </div>
                        </div>
                        <div className="text-right" dir="rtl">
                          <div className="text-gray-500 font-bold text-[12px]">
                            {row.labelAr}
                          </div>
                          <div
                            className={`text-gray-900 ${row.mono ? "font-mono" : ""}`}
                          >
                            {row.valueAr || ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className=" text-[16px] text-gray-500 space-y-0.5 bg-gray-100 px-3 py-2 rounded border border-gray-300 mb-2">
              <div className="flex gap-3">
                <div className="text-gray-800 font-bold">
                  Description / الوصف :
                </div>
                <div className="text-gray-500 font-medium">
                  {invoiceData.routeType === "MIXED"
                    ? "International Ticket – KSA Origin / تذكرة دولية – المغادرة من السعودية"
                    : invoiceData.routeType === "DOMESTIC"
                      ? "Domestic Airline Ticket / تذكرة طيران محلية"
                      : invoiceData.routeType === "Internal"
                        ? "International Ticket – KSA Destination / تذكرة دولية – الوصول إلى السعودية"
                        : invoiceData.routeType === "ZERO_VAT"
                          ? "International Ticket – Non-KSA / تذكرة دولية – خارج السعودية"
                          : ""}
                </div>
              </div>
            </div>
            <div className="mb-4 bg-gradient-to-tl from-gray-600 to-gray-700 text-white p-1/2 rounded flex items-center justify-center gap-8">
              <h2 className="text-lg font-bold">TAX INVOICE</h2>
              <p className="text-lg font-bold" dir="rtl">
                فاتورة ضريبية
              </p>
            </div>
            <div className="mb-3 print:hidden">
              <div className="border-1 border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-100 border-b-2 border-gray-400 px-4 py-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Customer Information (optional)
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600 block">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Type customer name to include it on the printed invoice"
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600 block">
                      Customer Address
                    </label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Type customer address to include it on the printed invoice"
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Print-only static rendering — omitted entirely if nothing was typed */}
            {hasCustomerInfo && (
              <div className="hidden print:block mb-3">
                <div className="border-1 border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-100 border-b-2 border-gray-400 px-4 py-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Customer Information
                    </h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    {customerName.trim() && (
                      <div>
                        <span className="text-xs text-gray-600 block">
                          Customer Name
                        </span>
                        <span className="text-xs font-bold text-gray-900">
                          {customerName}
                        </span>
                      </div>
                    )}
                    {customerAddress.trim() && (
                      <div>
                        <span className="text-xs text-gray-600 block">
                          Customer Address
                        </span>
                        <span className="text-xs text-gray-900 leading-relaxed">
                          {customerAddress}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="mb-3">
              <div className="border-1 border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-tl from-gray-600 to-gray-700 text-white">
                      <th className="border-r border-gray-700 px-3 py-1 text-left font-semibold">
                        <div className="leading-tight">Ticket No.</div>
                        <div
                          className="font-normal text-[10px] opacity-90 mt-0.5"
                          dir="rtl"
                        >
                          رقم التذكرة
                        </div>
                      </th>
                      <th className="border-r border-gray-700 px-3 py-1 text-left font-semibold">
                        <div className="leading-tight">Passenger Name</div>
                        <div
                          className="font-normal text-[10px] opacity-90 mt-0.5"
                          dir="rtl"
                        >
                          اسم الراكب
                        </div>
                      </th>
                      <th className="border-r border-gray-700 px-3 py-1 text-left font-semibold">
                        <div className="leading-tight">Airline</div>
                        <div
                          className="font-normal text-[10px] opacity-90 mt-0.5"
                          dir="rtl"
                        >
                          شركة الطيران
                        </div>
                      </th>
                      <th className="border-r border-gray-700 px-3 py-1 text-left font-semibold">
                        <div className="leading-tight">Route</div>
                        <div
                          className="font-normal text-[10px] opacity-90 mt-0.5"
                          dir="rtl"
                        >
                          المسار
                        </div>
                      </th>
                      <th className="border-r border-gray-700 px-3 py-1 text-left font-semibold">
                        <div className="leading-tight">PNR</div>
                        <div
                          className="font-normal text-[10px] opacity-90 mt-0.5"
                          dir="rtl"
                        >
                          رقم الهاتف
                        </div>
                      </th>
                      <th className="border-r border-gray-700 px-3 py-1 text-left font-semibold">
                        <div className="leading-tight">Vendor</div>
                        <div
                          className="font-normal text-[10px] opacity-90 mt-0.5"
                          dir="rtl"
                        >
                          المورد
                        </div>
                      </th>
                      <th className="border-r border-gray-700 px-3 py-1 text-right font-semibold">
                        <div className="leading-tight">Base Fare</div>
                        <div
                          className="font-normal text-[10px] opacity-90 mt-0.5"
                          dir="rtl"
                        >
                          الأجرة الأساسية
                        </div>
                      </th>
                      <th className="border-r border-gray-700 px-3 py-1 text-right font-semibold">
                        <div className="leading-tight">S.C</div>
                        <div
                          className="font-normal text-[10px] opacity-90 mt-0.5"
                          dir="rtl"
                        >
                          تكلفة الخدمة
                        </div>
                      </th>
                      <th className="px-3 py-1 text-right font-semibold">
                        <div className="leading-tight">VAT (15%)</div>
                        <div
                          className="font-normal text-[10px] opacity-90 mt-0.5"
                          dir="rtl"
                        >
                          ضريبة
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="border-r border-gray-300 px-3 py-2 font-mono">
                        {invoiceData.documentNo || "N/A"}
                      </td>
                      <td className="border-r border-gray-300 px-3 py-2 font-semibold text-gray-900">
                        {invoiceData.paxName || "N/A"}
                      </td>
                      <td className="border-r border-gray-300 px-3 py-2">
                        <div className="font-medium">
                          {invoiceData.airline?.airlineName || "N/A"}
                        </div>
                        {invoiceData.airline?.iataName && (
                          <div className="text-[10px] text-gray-600">
                            ({invoiceData.airline.iataName})
                          </div>
                        )}
                      </td>
                      <td className="border-r border-gray-300 px-3 py-2 font-medium">
                        {formatDestinations(invoiceData.destinations)}
                      </td>
                      <td className="border-r border-gray-300 px-3 py-2 text-right font-semibold text-green-700">
                        {invoiceData.pnr}
                      </td>
                      <td className="border-r border-gray-300 px-3 py-2">
                        {invoiceData.vendor?.vendorName || "N/A"}
                      </td>
                      <td className="border-r border-gray-300 px-3 py-2 text-right font-semibold">
                        {baseFare.toFixed(2)}
                      </td>
                      <td className="border-r border-gray-300 px-3 py-2 text-right font-semibold text-green-700">
                        {serviceCharges.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-gray-900">
                        {vatAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Section */}
            <div className="flex flex-row-reverse justify-between mb-1">
              <div className="">
                <div className="border-1 border-gray-300 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="py-4 px-4 text-gray-700 font-medium">
                          Base Fare / الأجرة الأساسية
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-gray-900">
                          SAR {baseFare.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300 bg-gray-50">
                        <td className="py-2.5 px-4 text-gray-700 font-medium">
                          Service Charges / رسوم الخدمة
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-green-700">
                          SAR {serviceCharges.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="bg-gradient-to-tl from-gray-600 to-gray-700 text-white">
                        <td className="py-4 px-4 font-bold text-sm uppercase tracking-wide">
                          <div className="flex items-center">
                            <span>Grand Total / المجموع الكلي</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-bold text-2xl tracking-wide">
                            SAR {rowTotal.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="border-t-2 border-gray-300 pt-5">
              <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide flex items-center">
                <span className="bg-gradient-to-tl from-gray-600 to-gray-700 text-white px-2 py-1 mr-2">
                  T&C
                </span>
                Terms & Conditions / الشروط والأحكام
              </h3>
              <div className="text-[10px] text-gray-600 space-y-1.5 leading-relaxed bg-gray-50 p-4 rounded border border-gray-200">
                <p className="flex items-start">
                  <span className="text-gray-900 font-bold mr-2 flex-shrink-0">
                    •
                  </span>
                  <span>
                    This is a computer generated statement, hence does not
                    require any signature. / هذا بيان تم إنشاؤه بواسطة
                    الكمبيوتر، وبالتالي لا يتطلب أي توقيع.
                  </span>
                </p>
                <p className="flex items-start">
                  <span className="text-gray-900 font-bold mr-2 flex-shrink-0">
                    •
                  </span>
                  <span>
                    Cash payments to be made to the cashier and printed official
                    receipt must be obtained. / يجب الحصول على المدفوعات النقدية
                    المدفوعة للصراف والإيصال الرسمي المطبوع.
                  </span>
                </p>
                <p className="flex items-start">
                  <span className="text-gray-900 font-bold mr-2 flex-shrink-0">
                    •
                  </span>
                  <span>
                    All cheques/demand drafts in payment of bills must be
                    crossed "A/c Payee Only" and drawn in favour of{" "}
                    {companyData.name}.
                  </span>
                </p>
                <p className="flex items-start">
                  <span className="text-gray-900 font-bold mr-2 flex-shrink-0">
                    •
                  </span>
                  <span>
                    If you have any queries or dispute on the invoice, please
                    raise the query within 7 days of the invoice otherwise we
                    consider it as accepted. / إذا كان لديك أي استفسارات أو نزاع
                    بشأن الفاتورة، يرجى طرح الاستفسار في غضون 7 أيام من الفاتورة
                    وإلا سنعتبرها مقبولة.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoicePrint;
