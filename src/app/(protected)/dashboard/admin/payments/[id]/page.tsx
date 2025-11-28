/*eslint-disable  @typescript-eslint/no-explicit-any*/
// src/app/(protected)/dashboard/admin/payments/[id]/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentDetailPage() {
  const { id } = useParams();
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/payments/${id}`).then((res) => res.json()).then(setPayment);
  }, [id]);

  if (!payment) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Payment Details</CardTitle>
            <Badge variant={payment.status === "PAID" ? "default" : "secondary"} className="text-lg px-3 py-1">
              {payment.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Invoice ID:</strong> {payment.invoiceId}</div>
            <div><strong>Amount:</strong> ₹{payment.amount.toLocaleString()}</div>
            <div><strong>Method:</strong> {payment.method}</div>
            <div><strong>Date:</strong> {new Date(payment.createdAt).toLocaleString()}</div>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">User</h3>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {payment.user.name} ({payment.user.email})
            </div>
          </div>
          <Button className="w-full mt-4">
            <Download className="h-4 w-4 mr-2" /> Download Invoice PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}