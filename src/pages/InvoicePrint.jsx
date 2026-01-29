"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const InvoicePrint = () => {
    const saleId = useParams();
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");

    // Static company data
    const companyData = {
        name: "Al Rayyan TRAVEL AND TOURISM",
        nameArabic: "شركة الريان للسفر والسياحة",
        address: "KHAMIS MUSHAIT MAIN STREET BENGALI MARKET AL BALAD STREET BUILDING NO 3819, Saudi Arabia",
        phone: "+966 12 2631966",
        email: "alrayyantravels247@gmail.com",
        website: "www.al-rayyantravel.com",
        trn: "310916231300003",
        trnArabic: "٣١٠٩١٦٢٣١٣٠٠٠٠٣",
        crNumber: "2050144259",
        branchAddressArabic: "خميس مشيط الشارع الرئيسي السوق البنغالي شارع البلد مبنى رقم 3819, المملكة العربية السعودية",
    };

    useEffect(() => {
        const fetchInvoiceData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/api/sales/saleId/${saleId.saleId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

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
        return destinations.map(d => d.value).join(" / ");
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-');
    };

    // Helper function to convert number to words
    const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        if (num === 0) return 'Zero';

        const convert = (n) => {
            if (n < 10) return ones[n];
            if (n < 20) return teens[n - 10];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
            if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
            return '';
        };

        const integerPart = Math.floor(num);
        const decimalPart = Math.round((num - integerPart) * 100);

        let result = '';

        if (integerPart >= 1000) {
            result += convert(Math.floor(integerPart / 1000)) + ' Thousand ';
            integerPart %= 1000;
        }

        result += convert(integerPart);

        if (decimalPart > 0) {
            result += ' and ' + convert(decimalPart) + ' Halala';
        }

        return result.trim() + ' Only';
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
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <p className="text-red-600 text-lg font-semibold mb-2">Error loading invoice</p>
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

    const baseFare = invoiceData.sellPrice || 0;
    const serviceCharges = invoiceData.profit || 0;
    const vatAmount = invoiceData.vatAmount || 0;
    const rowTotal = baseFare + serviceCharges + vatAmount;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[210mm] mx-auto bg-white shadow-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
                {/* Main Content Wrapper with Padding */}
                <div className="p-8">

                    {/* Header Section */}
                    <div className="border-b-2 border-gray-900 pb-6 mb-3">
                        <div className="flex justify-between items-start gap-8">

                            {/* Company Info */}
                            <div className="flex-1">
                                <h1 className="text-xl font-bold text-gray-900 mb-1 uppercase tracking-wide">
                                    {companyData.name}
                                </h1>
                                <h2 className="text-base text-gray-700 mb-4">
                                    {companyData.nameArabic}
                                </h2>
                                <div className="text-xs text-gray-600 space-y-1 leading-relaxed">
                                    <p>{companyData.address}</p>
                                    <p className="font-medium">{companyData.phone} | {companyData.email}</p>
                                    <p className="text-gray-500">{companyData.website}</p>
                                </div>
                                <div className="mt-4 text-xs space-y-1">
                                    <p className="text-gray-900">
                                        <span className="font-semibold">VAT/TRN:</span> <span className="font-mono">{companyData.trn}</span>
                                    </p>
                                    <p className="text-gray-900">
                                        <span className="font-semibold">CR Number:</span> <span className="font-mono">{companyData.crNumber}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Invoice Title & Info */}
                            <div className="text-right">
                                <div className="mb-4 bg-gradient-to-tl from-gray-600 to-gray-700 text-white px-6 py-3 rounded">
                                    <h2 className="text-2xl font-bold mb-1">TAX INVOICE</h2>
                                    <p className="text-sm opacity-90" dir="rtl">فاتورة ضريبية</p>
                                </div>
                                <div className="text-xs space-y-1 bg-gray-50 p-4 border-1 border-gray-300 rounded">
                                    <div className="space-y-2">
                                        <div className="flex justify-between gap-4">
                                            <span className="text-gray-600">Invoice No.:</span>
                                            <span className="font-bold text-gray-900">{invoiceData.invoice?.invoiceNo || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-gray-600">Date:</span>
                                            <span className="font-semibold text-gray-900">{formatDate(invoiceData.invoice?.saleDate)}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-gray-600">Ref. No.:</span>
                                            <span className="font-semibold text-gray-900">{invoiceData.documentNo || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-gray-600">Payment:</span>
                                            <span className="font-semibold text-gray-900">{invoiceData.paymentType || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information Section - Enhanced */}
                    <div className="mb-3">
                        <div className="border-1 border-gray-200 rounded-md overflow-hidden">

                            {/* Section Header */}
                            <div className="bg-gray-100 border-b-2 border-gray-400">
                                <div className="grid grid-cols-2">
                                    <div className="px-4 py-3 border-r border-gray-300">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                            Customer Information
                                        </h3>
                                    </div>
                                    <div className="px-4 py-3 text-right" dir="rtl">
                                        <h3 className="text-sm font-bold text-gray-900">
                                            معلومات العميل
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Details Rows */}
                            <div className="divide-y divide-gray-300">

                                {/* Row 1: Customer Name */}
                                <div className="grid grid-cols-2 hover:bg-gray-50 transition-colors">
                                    <div className="px-4 py-3 flex items-center gap-1">
                                        <span className="text-xs text-gray-600 block">Customer Name:</span>
                                        <span className="text-xs font-bold text-gray-900">
                                            {invoiceData.customer?.customerName || "N/A"}  
                                        </span>
                                    </div>
                                    <div className="px-4 flex items-center gap-1 text-right" dir="rtl">
                                        <span className="text-xs text-gray-600 block">اسم العميل:</span>
                                        <span className="text-xs font-bold text-gray-900">
                                            {invoiceData.customer?.customerNameArabic ||
                                                invoiceData.customer?.customerName ||
                                                "غير متوفر"}
                                        </span>
                                    </div>
                                    <div className="px-4 flex item-center gap-1">
                                        <span className="text-xs text-gray-600 block">Customer VAT ID</span>
                                        <span className="text-xs font-semibold text-gray-900 font-mono">
                                            {invoiceData.customer?.vat || "N/A"}
                                        </span>
                                    </div>
                                    <div className="px-4 text-right flex items-center gap-1" dir="rtl">
                                        <span className="text-xs text-gray-600 block">الرقم الضريبي للعميل:</span>
                                        <span className="text-xs font-semibold text-gray-900 font-mono">
                                            {invoiceData.customer?.vat || "غير متوفر"}
                                        </span>
                                    </div>
                                    <div className="px-4 py-3 flex item-center gap-1">
                                        <span className="text-xs text-gray-600 block">Address</span>
                                        <span className="text-xs text-gray-900 leading-relaxed">
                                            {invoiceData.customer?.address || "N/A"}
                                        </span>
                                    </div>
                                    <div className="px-4 text-right flex items-center gap-1" dir="rtl">
                                        <span className="text-xs text-gray-600 block">العنوان:</span>
                                        <span className="text-xs text-gray-900 leading-relaxed">
                                            {invoiceData.customer?.addressArabic ||
                                                invoiceData.customer?.address ||
                                                "غير متوفر"}
                                        </span>
                                    </div>
                                    <div className="px-4 flex item-center gap-1">
                                        <span className="text-xs text-gray-600 block">Phone</span>
                                        <span className="text-xs font-semibold text-gray-900">
                                            {invoiceData.customer?.phone || "N/A"}
                                        </span>
                                    </div>
                                    <div className="px-4 flex items-center gap-1 text-right" dir="rtl">
                                        <span className="text-xs text-gray-600 block">رقم الهاتف:</span>
                                        <span className="text-xs font-semibold text-gray-900" dir="ltr">
                                            {invoiceData.customer?.phone || "غير متوفر"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-3">
                        <div className="border-1 border-gray-300 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-tl from-gray-600 to-gray-700 text-white">
                                        <th className="border-r border-gray-700 px-3 py-3 text-left font-semibold">
                                            <div className="leading-tight">Ticket No.</div>
                                            <div className="font-normal text-[10px] opacity-90 mt-0.5" dir="rtl">رقم التذكرة</div>
                                        </th>
                                        <th className="border-r border-gray-700 px-3 py-3 text-left font-semibold">
                                            <div className="leading-tight">Passenger Name</div>
                                            <div className="font-normal text-[10px] opacity-90 mt-0.5" dir="rtl">اسم الراكب</div>
                                        </th>
                                        <th className="border-r border-gray-700 px-3 py-3 text-left font-semibold">
                                            <div className="leading-tight">Airline</div>
                                            <div className="font-normal text-[10px] opacity-90 mt-0.5" dir="rtl">شركة الطيران</div>
                                        </th>
                                        <th className="border-r border-gray-700 px-3 py-3 text-left font-semibold">
                                            <div className="leading-tight">Route</div>
                                            <div className="font-normal text-[10px] opacity-90 mt-0.5" dir="rtl">المسار</div>
                                        </th>
                                        <th className="border-r border-gray-700 px-3 py-3 text-left font-semibold">
                                            <div className="leading-tight">Vendor</div>
                                            <div className="font-normal text-[10px] opacity-90 mt-0.5" dir="rtl">المورد</div>
                                        </th>
                                        <th className="border-r border-gray-700 px-3 py-3 text-right font-semibold">
                                            <div className="leading-tight">Base Fare</div>
                                            <div className="font-normal text-[10px] opacity-90 mt-0.5" dir="rtl">الأجرة الأساسية</div>
                                        </th>
                                        <th className="border-r border-gray-700 px-3 py-3 text-right font-semibold">
                                            <div className="leading-tight">Service Charges</div>
                                            <div className="font-normal text-[10px] opacity-90 mt-0.5" dir="rtl">رسوم الخدمة</div>
                                        </th>
                                        <th className="border-r border-gray-700 px-3 py-3 text-right font-semibold">
                                            <div className="leading-tight">VAT (15%)</div>
                                            <div className="font-normal text-[10px] opacity-90 mt-0.5" dir="rtl">ضريبة</div>
                                        </th>
                                        <th className="px-3 py-3 text-right font-semibold">
                                            <div className="leading-tight">Total</div>
                                            <div className="font-normal text-[10px] opacity-90 mt-0.5" dir="rtl">مجموع</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="border-r border-gray-300 px-3 py-3 font-mono">{invoiceData.documentNo || 'N/A'}</td>
                                        <td className="border-r border-gray-300 px-3 py-3 font-semibold text-gray-900">{invoiceData.paxName || 'N/A'}</td>
                                        <td className="border-r border-gray-300 px-3 py-3">
                                            <div className="font-medium">{invoiceData.airline?.airlineName || 'N/A'}</div>
                                            {invoiceData.airline?.iataName && (
                                                <div className="text-[10px] text-gray-600">({invoiceData.airline.iataName})</div>
                                            )}
                                        </td>
                                        <td className="border-r border-gray-300 px-3 py-3 font-medium">{formatDestinations(invoiceData.destinations)}</td>
                                        <td className="border-r border-gray-300 px-3 py-3">{invoiceData.vendor?.vendorName || 'N/A'}</td>
                                        <td className="border-r border-gray-300 px-3 py-3 text-right font-semibold">{baseFare.toFixed(2)}</td>
                                        <td className="border-r border-gray-300 px-3 py-3 text-right font-semibold text-green-700">{serviceCharges.toFixed(2)}</td>
                                        <td className="border-r border-gray-300 px-3 py-3 text-right font-semibold text-blue-700">{vatAmount.toFixed(2)}</td>
                                        <td className="px-3 py-3 text-right font-bold text-gray-900">{rowTotal.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="flex justify-end mb-3">
                        <div className="w-96">
                            <div className="border-1 border-gray-300 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-xs">
                                    <tbody>
                                        <tr className="border-b border-gray-300">
                                            <td className="py-2.5 px-4 text-gray-700 font-medium">Base Fare / الأجرة الأساسية</td>
                                            <td className="py-2.5 px-4 text-right font-semibold text-gray-900">SAR {baseFare.toFixed(2)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-300 bg-gray-50">
                                            <td className="py-2.5 px-4 text-gray-700 font-medium">Service Charges / رسوم الخدمة</td>
                                            <td className="py-2.5 px-4 text-right font-semibold text-green-700">SAR {serviceCharges.toFixed(2)}</td>
                                        </tr>
                                        <tr className="border-b-2 border-gray-400 bg-gray-50">
                                            <td className="py-2.5 px-4 font-semibold text-gray-900">VAT @ 15% / ضريبة القيمة المضافة</td>
                                            <td className="py-2.5 px-4 text-right font-bold text-blue-700">SAR {vatAmount.toFixed(2)}</td>
                                        </tr>
                                        <tr className="bg-gradient-to-tl from-gray-600 to-gray-700 text-white">
                                            <td className="py-4 px-4 font-bold text-sm uppercase tracking-wide">
                                                <div className="flex items-center">
                                                    <span>Grand Total / المجموع الكلي</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="font-bold text-2xl tracking-wide">SAR {rowTotal.toFixed(2)}</div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                            </div>
                        </div>
                    </div>

                    {/* Remarks Section
                    {invoiceData.remarks && (
                        <div className="mb-3">
                            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded shadow-sm">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-semibold text-amber-900">Remarks</p>
                                        <p className="text-xs text-amber-800 mt-1">{invoiceData.remarks}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )} */}

                    {/* Terms & Conditions */}
                    <div className="border-t-2 border-gray-300 pt-5 mt-8">
                        <h3 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center">
                            <span className="bg-gradient-to-tl from-gray-600 to-gray-700 text-white px-2 py-1 mr-2">T&C</span>
                            Terms & Conditions / الشروط والأحكام
                        </h3>
                        <div className="text-[10px] text-gray-600 space-y-1.5 leading-relaxed bg-gray-50 p-4 rounded border border-gray-200">
                            <p className="flex items-start">
                                <span className="text-gray-900 font-bold mr-2 flex-shrink-0">•</span>
                                <span>This is a computer generated statement, hence does not require any signature. / هذا بيان تم إنشاؤه بواسطة الكمبيوتر، وبالتالي لا يتطلب أي توقيع.</span>
                            </p>
                            <p className="flex items-start">
                                <span className="text-gray-900 font-bold mr-2 flex-shrink-0">•</span>
                                <span>Cash payments to be made to the cashier and printed official receipt must be obtained. / يجب الحصول على المدفوعات النقدية المدفوعة للصراف والإيصال الرسمي المطبوع.</span>
                            </p>
                            <p className="flex items-start">
                                <span className="text-gray-900 font-bold mr-2 flex-shrink-0">•</span>
                                <span>All cheques/demand drafts in payment of bills must be crossed "A/c Payee Only" and drawn in favour of {companyData.name}.</span>
                            </p>
                            <p className="flex items-start">
                                <span className="text-gray-900 font-bold mr-2 flex-shrink-0">•</span>
                                <span>Interest @ 24% per annum will be charged on all outstanding bills after due date. / سيتم احتساب فائدة بنسبة 24٪ سنويًا على جميع الفواتير المستحقة بعد تاريخ الاستحقاق.</span>
                            </p>
                            <p className="flex items-start">
                                <span className="text-gray-900 font-bold mr-2 flex-shrink-0">•</span>
                                <span>If you have any queries or dispute on the invoice, please raise the query within 7 days of the invoice otherwise we consider it as accepted. / إذا كان لديك أي استفسارات أو نزاع بشأن الفاتورة، يرجى طرح الاستفسار في غضون 7 أيام من الفاتورة وإلا سنعتبرها مقبولة.</span>
                            </p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default InvoicePrint;