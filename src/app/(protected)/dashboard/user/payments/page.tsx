// app/dashboard/user/payments/page.tsx (Updated with invoice download)
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { AlertCircle, IndianRupee, Loader2, Download, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Payment {
  id: string;
  invoiceNumber: string;
  amount: string;
  finalAmount: string;
  currency: "INR";
  status: "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";
  createdAt: string;
  courseTitle: string;
}

export default function PaymentsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      if (!userId) return;
      try {
        setLoading(true);
        const res = await fetch('/api/user/payments');
        if (!res.ok) throw new Error("Failed to load payments");

        const data = await res.json();
        setPayments(data.payments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [userId]);

  const handleDownloadInvoice = async (invoiceNumber: string) => {
    setDownloadingInvoice(invoiceNumber);
    try {
      const response = await fetch("/api/invoice/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNumber }),
      });

      if (!response.ok) throw new Error("Failed to download invoice");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download invoice. Please try again.");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const getStatusBadge = (status: Payment["status"]) => {
    const config = {
      COMPLETED: {
        label: "Completed",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "✓"
      },
      PENDING: {
        label: "Failed",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: "⏳"
      },
      FAILED: {
        label: "Failed",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: "✕"
      },
      REFUNDED: {
        label: "Refunded",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: "↩"
      },
    };
    const { label, color, icon } = config[status] || config.PENDING;
    return (
      <Badge variant="outline" className={`${color} font-medium`}>
        {icon} {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <div className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-ping"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="relative inline-block mb-4">
            <AlertCircle className="h-16 w-16 text-blue-600 mx-auto" />
            <div className="absolute -inset-2 bg-blue-100 rounded-full blur-sm"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Payments</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <div className="relative w-24 h-24 bg-gradient-to-br from-blue-50 to-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-100">
            <IndianRupee className="h-12 w-12 text-amber-500" />
            <div className="absolute inset-0 rounded-full border-2 border-amber-200 animate-pulse"></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Payments Yet</h3>
          <p className="text-gray-600 mb-8 text-lg">
            Your payment history will appear here once you enroll in a course.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
            <Link href="/courses" className="flex items-center gap-2">
              Explore Courses <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
        <p className="text-gray-600 mt-2">
          View all your course purchases and invoices
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5 text-blue-800 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="text-center">
            <p className="text-3xl font-bold">{payments.length}</p>
            <p className="text-sm font-medium text-blue-500 mt-1">Total Payments</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 border border-yellow-200 rounded-2xl p-5 text-yellow-800 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="text-center">
            <p className="text-3xl font-bold">
              {payments.filter(p => p.status === "COMPLETED").length}
            </p>
            <p className="text-sm font-medium text-yellow-600 mt-1">Completed</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5 text-blue-800 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="text-center">
            <p className="text-3xl font-bold">
              {payments.filter(p => p.status === "PENDING").length}
            </p>
            <p className="text-sm font-medium text-blue-600 mt-1">Failed</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border border-amber-200 rounded-2xl p-5 text-amber-800 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="text-center">
            <p className="text-3xl font-bold">
              ₹{payments
                .filter(p => p.status === "COMPLETED")
                .reduce((sum, p) => sum + Number(p.finalAmount), 0)
                .toLocaleString("en-IN")}
            </p>
            <p className="text-sm font-medium text-amber-600 mt-1">Total Spent</p>
          </div>
        </div>
      </div>

      {/* Payment Cards */}
      <div className="space-y-4">
        {payments.map((payment) => (
          <Card 
            key={payment.id} 
            className="hover:shadow-md transition-all duration-200 border-gray-200 hover:border-blue-200 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 to-amber-500"></div>
            
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-gray-900 font-semibold">
                    {payment.courseTitle}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-gray-500">
                    <span className="font-mono bg-gray-50 px-2 py-1 rounded text-sm border">
                      #{payment.invoiceNumber}
                    </span>
                    <span className="text-sm">
                      {format(new Date(payment.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                    </span>
                  </CardDescription>
                </div>
                {getStatusBadge(payment.status)}
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Amount Paid</p>
                  <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                    <IndianRupee className="h-5 w-5 text-amber-600" />
                    {Number(payment.finalAmount).toLocaleString("en-IN")}
                  </p>
                </div>
                
                {payment.status === "COMPLETED" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => handleDownloadInvoice(payment.invoiceNumber)}
                    disabled={downloadingInvoice === payment.invoiceNumber}
                  >
                    {downloadingInvoice === payment.invoiceNumber ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Invoice
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}