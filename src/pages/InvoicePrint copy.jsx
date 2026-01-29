"use client";

import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";

const InvoicePrint = () => {
  // Static data - will be replaced with props later
  const invoiceData = {
    company: {
      name: "Al Rayyan TRAVEL AND TOURISM",
      nameArabic: "شركة الريان للسفر والسياحة",
      address: "KHAMIS MUSHAIT MAIN STREET BENGALI MARKET AL BALAD STREET BUILDING NO 3819, Saudi Arabia",
      phone: "+966 12 2631966",
      email: "alrayyantravels247@gmail.com",
      website: "www.al-rayyantravel.com",
      trn: "310916231300003",
      trnArabic: "٣١٠٩١٦٢٣١٣٠٠٠٠٣",
      crNumber: "2050144259",
      branchAddress: "خميس مشيط الشارع الرئيسي السوق البنغالي شارع البلد مبنى رقم 3819, المملكة العربية السعودية",
      country: "SAUDI ARABIA",
    },
    customer: {
      name: "Mudassar Javed",
      vat: "07741258965412",
      address: "KHAMIS MUSHAIT MAIN STREET BENGALI MARKET AL BALAD STREET BUILDING NO 3819",
      phone: "+966 531102945",
      email: "alrayyantravels247@gmail.com",
    },
    invoice: {
      number: "010-DS-27146087",
      date: "28-01-2026",
      salesRep: "ZAIN MOHAMMAD",
      placeOfSupply: "SAUDI ARABIA",
      refNumber: "AS260160473",
      employee: "",
    },
    sale: {
      remarks: "03451/Walk",
      ticketNo: "7J195007F3",
      paxName: "MAHMOOD MANZOOR AHMAD",
      sector: "AHB/RUH F3",
      carrier: "MAHMOOD",
      travelDate: "30-01-2026",
      class: "V",
      basicFare: 201.38,
      misc: 0,
      serviceCharges: 4.30,
      vatRate: 15,
      vatAmount: 30.85,
      discountPaid: 0.00,
      total: 236.53,
    },
    totals: {
      taxableTotal: 205.68,
      vatAmount: 30.85,
      invoiceTotal: 236.53,
      inWords: "Two Hundred Thirty Six and Fifty Three Only",
    },
  };

  return (
    <div className="max-w-[210mm] mx-auto bg-white p-8 shadow-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-6 mb-6">
        <div className="flex justify-between items-start">
          {/* Company Info */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 mb-1 uppercase">
              {invoiceData.company.name}
            </h1>
            <h2 className="text-gray-700 mb-3" >
              {invoiceData.company.nameArabic}
            </h2>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p>{invoiceData.company.address}</p>
              <p>{invoiceData.company.phone} | {invoiceData.company.email}</p>
              <p>{invoiceData.company.website}</p>
            </div>
            <div className="mt-3 text-xs">
              <p className="text-gray-900">
                <span className="font-semibold">VAT/TRN:</span> {invoiceData.company.trn}
              </p>
              <p className="text-gray-900">
                <span className="font-semibold">CR Number:</span> {invoiceData.company.crNumber}
              </p>
            </div>
          </div>

          {/* Invoice Title & Info */}
          <div className="text-right">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-0.5">TAX INVOICE</h2>
              <p className="text-sm text-gray-600" dir="rtl">فاتورة ضريبية</p>
            </div>
            <div className="text-xs space-y-1 bg-gray-50 p-3 border border-gray-300">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="text-gray-600 text-left">Invoice No.:</span>
                <span className="font-semibold text-gray-900 text-right">{invoiceData.invoice.number}</span>
                
                <span className="text-gray-600 text-left">Date:</span>
                <span className="font-semibold text-gray-900 text-right">{invoiceData.invoice.date}</span>
                
                <span className="text-gray-600 text-left">Ref. No.:</span>
                <span className="font-semibold text-gray-900 text-right">{invoiceData.invoice.refNumber}</span>
                
                <span className="text-gray-600 text-left">Sales Rep.:</span>
                <span className="font-semibold text-gray-900 text-right">{invoiceData.invoice.salesRep}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Customer Details */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase border-b border-gray-300 pb-1">
              Bill To 
            </h3>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-gray-900">{invoiceData.customer.name}</p>
              <p className="text-gray-700">{invoiceData.customer.address}</p>
              <p className="text-gray-700">Tel: {invoiceData.customer.phone}</p>
              <p className="text-gray-700">Email: {invoiceData.customer.email}</p>
            </div>
          </div>

          {/* Sale Description */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase border-b border-gray-300 pb-1">
                الفاتورة إلى
            </h3>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-gray-900">{invoiceData.customer.name}</p>
              <p className="text-gray-700">{invoiceData.customer.address}</p>
              <p className="text-gray-700">Tel: {invoiceData.customer.phone}</p>
              <p className="text-gray-700">Email: {invoiceData.customer.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="border border-gray-900 px-2 py-2 text-left font-semibold">
                <div>Ticket No.</div>
                <div className="font-normal opacity-90" dir="rtl">رقم التذكرة</div>
              </th>
              <th className="border border-gray-900 px-2 py-2 text-left font-semibold">
                <div>Passenger Name</div>
                <div className="font-normal opacity-90" dir="rtl">اسم الراكب</div>
              </th>
              <th className="border border-gray-900 px-2 py-2 text-left font-semibold">
                <div>Sector</div>
                <div className="font-normal opacity-90" dir="rtl">قطاع</div>
              </th>
              <th className="border border-gray-900 px-2 py-2 text-left font-semibold">
                <div>Travel Date</div>
                <div className="font-normal opacity-90" dir="rtl">تاريخ السفر</div>
              </th>
              <th className="border border-gray-900 px-2 py-2 text-left font-semibold">
                <div>PNR</div>
              </th>
              <th className="border border-gray-900 px-2 py-2 text-right font-semibold">
                <div>Basic Fare</div>
                <div className="font-normal opacity-90" dir="rtl">الأجرة</div>
              </th>
              <th className="border border-gray-900 px-2 py-2 text-right font-semibold">
                <div>Service</div>
                <div className="font-normal opacity-90" dir="rtl">خدمة</div>
              </th>
              <th className="border border-gray-900 px-2 py-2 text-right font-semibold">
                <div>VAT (15%)</div>
                <div className="font-normal opacity-90" dir="rtl">ضريبة</div>
              </th>
              <th className="border border-gray-900 px-2 py-2 text-right font-semibold">
                <div>Total</div>
                <div className="font-normal opacity-90" dir="rtl">مجموع</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-2 py-2">{invoiceData.sale.ticketNo}</td>
              <td className="border border-gray-300 px-2 py-2 font-medium">{invoiceData.sale.paxName}</td>
              <td className="border border-gray-300 px-2 py-2">{invoiceData.sale.sector}</td>
              <td className="border border-gray-300 px-2 py-2">{invoiceData.sale.travelDate}</td>
              <td className="border border-gray-300 px-2 py-2">{invoiceData.sale.pnr}</td>
              <td className="border border-gray-300 px-2 py-2 text-right">{invoiceData.sale.basicFare.toFixed(2)}</td>
              <td className="border border-gray-300 px-2 py-2 text-right">{invoiceData.sale.serviceCharges.toFixed(2)}</td>
              <td className="border border-gray-300 px-2 py-2 text-right">{invoiceData.sale.vatAmount.toFixed(2)}</td>
              <td className="border border-gray-300 px-2 py-2 text-right font-semibold">{invoiceData.sale.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="flex justify-end mb-6">
        <div className="w-80">
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="py-1.5 px-3 text-gray-700">Taxable Amount / المبلغ الخاضع للضريبة</td>
                <td className="py-1.5 px-3 text-right font-semibold">SAR {invoiceData.totals.taxableTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 text-gray-700">Service Charges / رسوم الخدمة</td>
                <td className="py-1.5 px-3 text-right font-semibold">SAR {invoiceData.sale.serviceCharges.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 text-gray-700">Discount / خصم</td>
                <td className="py-1.5 px-3 text-right font-semibold">SAR {invoiceData.sale.discountPaid.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-gray-300">
                <td className="py-1.5 px-3 font-semibold text-gray-900">VAT @ 15% / ضريبة القيمة المضافة</td>
                <td className="py-1.5 px-3 text-right font-semibold">SAR {invoiceData.totals.vatAmount.toFixed(2)}</td>
              </tr>
              <tr className="bg-gray-900 text-white">
                <td className="py-2 px-3 font-bold">TOTAL / المجموع الكلي</td>
                <td className="py-2 px-3 text-right font-bold text-base">SAR {invoiceData.totals.invoiceTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2 px-3 py-1 bg-gray-50 border border-gray-300">
            <p className="text-xs text-gray-700 italic">
              Amount in words: <span className="font-semibold">{invoiceData.totals.inWords}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="border-t border-gray-300 pt-4 mt-6">
        <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase">
          Terms & Conditions / الشروط والأحكام
        </h3>
        <div className="text-[10px] text-gray-600 space-y-1 leading-relaxed">
          <p>• This is a computer generated statement, hence does not require any signature. / هذا بيان تم إنشاؤه بواسطة الكمبيوتر، وبالتالي لا يتطلب أي توقيع.</p>
          <p>• Cash payments to be made to the cashier and printed official receipt must be obtained. / يجب الحصول على المدفوعات النقدية المدفوعة للصراف والإيصال الرسمي المطبوع.</p>
          <p>• All cheques/demand drafts in payment of bills must be crossed "A/c Payee Only" and drawn in favour of {invoiceData.company.name}.</p>
          <p>• Interest @ 24% per annum will be charged on all outstanding bills after due date. / سيتم احتساب فائدة بنسبة 24٪ سنويًا على جميع الفواتير المستحقة بعد تاريخ الاستحقاق.</p>
          <p>• If you have any queries or dispute on the invoice, please raise the query within 7 days of the invoice otherwise we consider it as accepted. / إذا كان لديك أي استفسارات أو نزاع بشأن الفاتورة، يرجى طرح الاستفسار في غضون 7 أيام من الفاتورة وإلا سنعتبرها مقبولة.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-3 border-t border-gray-200 text-center">
        <p className="text-[10px] text-gray-500">
          Original for recipient / Duplicate for supplier • الأصلي للمستلم / نسخة للمورد
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          This invoice was generated electronically and is valid without signature
        </p>
      </div>
    </div>
  );
};

export default InvoicePrint;