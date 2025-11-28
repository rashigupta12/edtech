/*eslint-disable  @typescript-eslint/no-explicit-any*/
// components/invoices/InvoiceTemplate.tsx
"use client";

import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  gstNumber?: string;
  courseTitle: string;
  courseDescription?: string;
  originalPrice: number;
  adminDiscount?: number;
  jyotishiDiscount?: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: string;
  razorpayPaymentId?: string;
  appliedCoupons?: Array<{
    code: string;
    discountAmount: number;
    creatorType: "ADMIN" | "JYOTISHI";
  }>;
}

interface InvoiceTemplateProps {
  data: InvoiceData;
  showDownloadButton?: boolean;
  className?: string;
}

export function InvoiceTemplate({
  data,
  showDownloadButton = true,
  className = "",
}: InvoiceTemplateProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/invoice/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNumber: data.invoiceNumber }),
      });

      if (!response.ok) throw new Error("Failed to download invoice");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${data.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download invoice. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`bg-white ${className}`}>
      {/* Download Button */}
      {showDownloadButton && (
        <div className="flex justify-end mb-4 no-print">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download Invoice
              </>
            )}
          </Button>
        </div>
      )}

      {/* Invoice Content */}
      <div
        id="invoice-content"
        className="border border-gray-300 rounded-lg p-8 bg-white"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">
              FUTURETEK
            </h1>
            <p className="text-sm text-gray-600">Education & Training</p>
            <p className="text-sm text-gray-600 mt-2">
              Email: support@futuretek.com
            </p>
            <p className="text-sm text-gray-600">Phone: +91 XXXXXXXXXX</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">INVOICE</h2>
            <div className="bg-blue-50 px-4 py-2 rounded">
              <p className="text-sm font-semibold text-blue-600">
                {data.invoiceNumber}
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Date: {format(new Date(data.invoiceDate), "dd MMM yyyy")}
            </p>
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Bill To:
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-800">{data.customerName}</p>
            <p className="text-sm text-gray-600">{data.customerEmail}</p>
            {data.customerAddress && (
              <p className="text-sm text-gray-600 mt-1">
                {data.customerAddress}
              </p>
            )}
            {data.gstNumber && (
              <p className="text-sm text-gray-600 mt-1">
                GST No: {data.gstNumber}
              </p>
            )}
          </div>
        </div>

        {/* Course Details */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Description
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {data.courseTitle}
                    </p>
                    {data.courseDescription && (
                      <p className="text-sm text-gray-600 mt-1">
                        {data.courseDescription}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-right font-semibold text-gray-800">
                  ₹{data.originalPrice.toLocaleString("en-IN")}
                </td>
              </tr>

              {/* Discounts */}
              {data.appliedCoupons && data.appliedCoupons.length > 0 && (
                <>
                  {data.appliedCoupons.map((coupon, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-600">
                            Discount Applied ({coupon.code})
                          </span>
                          {coupon.creatorType === "JYOTISHI" && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Jyotishi Coupon
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-green-600 font-semibold">
                        -₹{coupon.discountAmount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* Subtotal */}
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-700">
                  Subtotal
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-800">
                  ₹{data.subtotal.toLocaleString("en-IN")}
                </td>
              </tr>

              {/* GST */}
              <tr className="border-b border-gray-200">
                <td className="py-3 px-4 text-gray-700">GST (18%)</td>
                <td className="py-3 px-4 text-right text-gray-800">
                  ₹{data.gstAmount.toLocaleString("en-IN")}
                </td>
              </tr>

              {/* Total */}
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td className="py-4 px-4 text-lg font-bold text-gray-800">
                  Total Amount
                </td>
                <td className="py-4 px-4 text-right text-2xl font-bold text-blue-600">
                  ₹{data.totalAmount.toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Details */}
        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Payment Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-semibold text-gray-800">
                {data.paymentMethod}
              </p>
            </div>
            {data.razorpayPaymentId && (
              <div>
                <p className="text-sm text-gray-600">Transaction ID</p>
                <p className="font-mono text-sm text-gray-800">
                  {data.razorpayPaymentId}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t-2 border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Thank you for your purchase!
          </p>
          <p className="text-xs text-gray-500">
            This is a computer-generated invoice and does not require a
            signature.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            For any queries, please contact support@futuretek.com
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

// Helper function to prepare invoice data from payment
export function prepareInvoiceData(payment: any, user: any, course: any) {
  const appliedCoupons = [];
  
  // Parse applied coupons if they exist
  if (payment.appliedCoupons) {
    appliedCoupons.push(...payment.appliedCoupons);
  }

  return {
    invoiceNumber: payment.invoiceNumber,
    invoiceDate: payment.createdAt,
    customerName: user.name,
    customerEmail: user.email,
    customerAddress: payment.billingAddress || undefined,
    gstNumber: user.gstNumber || undefined,
    courseTitle: course.title,
    courseDescription: course.description,
    originalPrice: parseFloat(payment.amount),
    adminDiscount: parseFloat(payment.adminDiscountAmount || "0"),
    jyotishiDiscount: parseFloat(payment.jyotishiDiscountAmount || "0"),
    subtotal: parseFloat(payment.amount) - parseFloat(payment.discountAmount || "0"),
    gstAmount: parseFloat(payment.gstAmount),
    totalAmount: parseFloat(payment.finalAmount),
    paymentMethod: "Razorpay",
    razorpayPaymentId: payment.razorpayPaymentId,
    appliedCoupons,
  };
}