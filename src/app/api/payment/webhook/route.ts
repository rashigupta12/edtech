/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { PaymentsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// app/api/payment/webhook/route.ts
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event) {
      case "payment.captured":
        // Payment successful
        break;
      case "payment.failed":
        // Update payment status to failed
        await db
          .update(PaymentsTable)
          .set({
            status: "FAILED",
            updatedAt: new Date(),
          })
          .where(eq(PaymentsTable.razorpayOrderId, event.payload.payment.entity.order_id));
        break;
      case "refund.created":
        // Handle refund
        await db
          .update(PaymentsTable)
          .set({
            status: "REFUNDED",
            updatedAt: new Date(),
          })
          .where(eq(PaymentsTable.razorpayPaymentId, event.payload.refund.entity.payment_id));
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}