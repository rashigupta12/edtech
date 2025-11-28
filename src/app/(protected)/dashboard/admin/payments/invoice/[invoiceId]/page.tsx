// src/app/(protected)/dashboard/admin/payments/invoice/[invoiceId]/page.tsx
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, CreditCard, Download, FileText, IndianRupee, User, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PaymentDetails {
  id: string;
  invoiceNumber: string;
  user: { id: string; name: string; email: string; mobile: string };
  course: { id: string; title: string; slug: string };
  amount: number;
  gstAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  jyotishiId?: string | null;
  commissionAmount?: number;
  billingAddress?: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
}

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/admin/payments/invoice/${invoiceId}`);
        const data = await res.json();

        // Map API response to UI model
        const mapped: PaymentDetails = {
          id: data.id,
          invoiceNumber: data.invoiceNumber,
          user: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            mobile: data.user.mobile || "—",
          },
          course: {
            id: data.enrollment.courseId,
            title: data.enrollment.course?.title || `Course #${data.enrollment.courseId.slice(0, 8)}`,
            slug: data.enrollment.course?.slug || data.enrollment.courseId,
          },
          amount: Number(data.amount),
          gstAmount: Number(data.gstAmount),
          discountAmount: Number(data.discountAmount),
          finalAmount: Number(data.finalAmount),
          currency: data.currency,
          status: data.status,
          paymentMethod: data.paymentMethod || "Razorpay",
          razorpayPaymentId: data.razorpayPaymentId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          jyotishiId: data.jyotishiId,
          commissionAmount: data.commissionAmount ? Number(data.commissionAmount) : undefined,
          billingAddress: data.billingAddress || undefined,
        };

        setPayment(mapped);
      } catch (err) {
        console.error("Failed to fetch invoice:", err);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) fetchInvoice();
  }, [invoiceId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Invoice not found.</p>
        <Link href="/dashboard/admin/payments">
          <Button variant="outline" className="mt-4">Back to Payments</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Invoice {payment.invoiceNumber}
          </h1>
          <p className="text-muted-foreground mt-1">
            Issued on {new Date(payment.createdAt).toLocaleDateString("en-IN")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={payment.status === "COMPLETED" ? "default" : payment.status === "PENDING" ? "secondary" : "destructive"}
            className="text-lg px-4 py-1 flex items-center gap-1"
          >
            {getStatusIcon(payment.status)}
            {payment.status}
          </Badge>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <Separator />

      {/* User & Course Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getInitials(payment.user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link href={`/dashboard/admin/users/${payment.user.id}`} className="font-semibold hover:underline">
                  {payment.user.name}
                </Link>
                <p className="text-sm text-muted-foreground">{payment.user.email}</p>
                <p className="text-sm text-muted-foreground">+91 {payment.user.mobile}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Course Enrolled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/courses/${payment.course.slug}`} className="font-semibold text-lg hover:underline block mb-1">
              {payment.course.title}
            </Link>
            <p className="text-sm text-muted-foreground">Course ID: {payment.course.id}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Payment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-lg">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Course Fee</span>
              <span className="font-medium">₹{payment.amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="font-medium">₹{payment.gstAmount.toLocaleString("en-IN")}</span>
            </div>
            {payment.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount Applied</span>
                <span>-₹{payment.discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total Paid</span>
              <span>₹{payment.finalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Payment Method:</strong> {payment.paymentMethod}
            </div>
            <div>
              <strong>Transaction ID:</strong>{" "}
              {payment.razorpayPaymentId ? (
                <span className="font-mono">{payment.razorpayPaymentId}</span>
              ) : (
                "—"
              )}
            </div>
            <div>
              <strong>Paid On:</strong>{" "}
              {new Date(payment.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
            <div>
              <strong>Status Updated:</strong>{" "}
              {new Date(payment.updatedAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          </div>

          {payment.jyotishiId && payment.commissionAmount !== undefined && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="font-semibold mb-1">Jyotishi Commission</p>
              <p className="text-sm">
                Jyotishi ID: <span className="font-mono">{payment.jyotishiId}</span>
              </p>
              <p className="text-sm">
                Commission: ₹{payment.commissionAmount.toLocaleString("en-IN")} (Paid: No)
              </p>
            </div>
          )}

          {payment.billingAddress && (
            <div className="mt-6">
              <p className="font-semibold mb-1">Billing Address</p>
              <p className="text-sm text-muted-foreground">
                {payment.billingAddress.line1}, {payment.billingAddress.city},{" "}
                {payment.billingAddress.state} - {payment.billingAddress.pincode}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/payments">Back to Payments</Link>
        </Button>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download Invoice PDF
        </Button>
      </div>
    </div>
  );
}