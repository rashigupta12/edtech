/*eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/payment/create-order/route.ts
import { db } from "@/db";
import { 
  CouponsTable, 
  CoursesTable, 
  PaymentsTable, 
  UsersTable,
  UserAddressTable,
} from "@/db/schema";
import { desc, eq, inArray, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from '@/auth';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Interface for GST data structure
interface GSTData {
  gstin?: string;
  legalName?: string;
  tradeName?: string;
  address?: string;
  status?: string;
  pradr?: {
    addr?: {
      dst?: string;
      stcd?: string;
      pncd?: string;
      bno?: string;
      flno?: string;
      bnm?: string;
      st?: string;
      loc?: string;
    };
    adr?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { 
      courseId, 
      couponCode, 
      paymentType = "DOMESTIC", 
      billingAddress, 
      gstNumber,
      gstData // Add gstData parameter to receive verified GST information
    } = await req.json();
    
    const session = await auth()
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: User not logged in" },
        { status: 401 }
      );
    }

    // Validate paymentType
    if (!paymentType || !["DOMESTIC", "FOREX"].includes(paymentType)) {
      return NextResponse.json(
        { error: "Invalid payment type. Must be DOMESTIC or FOREX" },
        { status: 400 }
      );
    }

    // ✅ COMPLETE GST DATA SAVING - Save GST number and address to user profile
    if (gstNumber) {
      console.log('🔄 Saving GST data to user profile:', {
        gstNumber,
        hasGstData: !!gstData,
        userId
      });

      // Update user's GST information
      await db
        .update(UsersTable)
        .set({
          gstNumber: gstNumber,
          isGstVerified: true, // Mark as verified since it was verified in checkout
          updatedAt: new Date(),
        })
        .where(eq(UsersTable.id, userId));
      
      console.log('✅ GST number saved to user profile:', gstNumber);

      // ✅ Save address from GST data if available
      if (gstData) {
        try {
          const gstInfo: GSTData = gstData;
          
          // Build complete address from GST data
          let fullAddress = "";
          let city = "";
          let state = "";
          let pinCode = "";

          if (gstInfo.pradr?.adr) {
            // Use the complete address string if available
            fullAddress = gstInfo.pradr.adr;
          } else if (gstInfo.pradr?.addr) {
            // Build address from components
            const addr = gstInfo.pradr.addr;
            const addressParts = [
              addr.flno,
              addr.bno && addr.bno !== "0" ? addr.bno : null,
              addr.bnm,
              addr.st,
              addr.loc,
            ].filter(Boolean);
            
            fullAddress = addressParts.join(", ");
            city = addr.dst || "";
            state = addr.stcd || "";
            pinCode = addr.pncd || "";
          }

          // If we have address data, save it
          if (fullAddress || gstInfo.address) {
            const finalAddress = fullAddress || gstInfo.address;
            
            // Check if user already has a default address
            const [existingAddress] = await db
              .select({ id: UserAddressTable.id })
              .from(UserAddressTable)
              .where(
                and(
                  eq(UserAddressTable.userId, userId),
                  eq(UserAddressTable.isDefault, true)
                )
              )
              .limit(1);

            if (existingAddress) {
              // Update existing address with GST address
              await db
                .update(UserAddressTable)
                .set({
                  addressLine1: finalAddress || "Address from GST",
                  addressLine2: "",
                  city: city || "City from GST",
                  state: state || "State from GST",
                  pinCode: pinCode || "000000",
                  country: "India",
                  updatedAt: new Date(),
                })
                .where(eq(UserAddressTable.id, existingAddress.id));
              
              console.log('✅ Updated existing address with GST data');
            } else {
              // Create new address from GST data
              await db
                .insert(UserAddressTable)
                .values({
                  userId: userId,
                  addressLine1: finalAddress || "Address from GST",
                  addressLine2: "",
                  city: city || "City from GST",
                  state: state || "State from GST",
                  pinCode: pinCode || "000000",
                  country: "India",
                  isDefault: true,
                });
              
              console.log('✅ Created new address from GST data');
            }

            console.log('📬 Address saved from GST verification:', {
              address: finalAddress,
              city,
              state,
              pinCode
            });
          }
        } catch (addressError) {
          console.error('❌ Error saving GST address:', addressError);
          // Don't throw error - continue with payment even if address save fails
        }
      }
    } else if (billingAddress) {
      // ✅ Save manual billing address if no GST provided
      console.log('🔄 Saving manual billing address:', billingAddress);
      
      try {
        const { addressLine1, addressLine2, city, state, pinCode, country } = billingAddress;
        
        // Check if user already has a default address
        const [existingAddress] = await db
          .select({ id: UserAddressTable.id })
          .from(UserAddressTable)
          .where(
            and(
              eq(UserAddressTable.userId, userId),
              eq(UserAddressTable.isDefault, true)
            )
          )
          .limit(1);

        if (existingAddress) {
          // Update existing address
          await db
            .update(UserAddressTable)
            .set({
              addressLine1,
              addressLine2: addressLine2 || "",
              city,
              state,
              pinCode,
              country: country || "India",
              updatedAt: new Date(),
            })
            .where(eq(UserAddressTable.id, existingAddress.id));
        } else {
          // Create new address
          await db
            .insert(UserAddressTable)
            .values({
              userId: userId,
              addressLine1,
              addressLine2: addressLine2 || "",
              city,
              state,
              pinCode,
              country: country || "India",
              isDefault: true,
            });
        }
        
        console.log('✅ Manual billing address saved successfully');
      } catch (addressError) {
        console.error('❌ Error saving manual address:', addressError);
        // Continue with payment even if address save fails
      }
    }

    // ✅ Get course WITH commission rate
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, courseId))
      .limit(1);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // ✅ Get course commission rate from database
    const courseCommissionRate = parseFloat(course.commissionPercourse || "0");
    
    console.log('📊 Course commission rate:', {
      courseId: course.id,
      courseTitle: course.title,
      commissionPercourse: course.commissionPercourse,
      commissionRate: courseCommissionRate
    });

    // Calculate base amount based on payment type
    const baseAmount = paymentType === "FOREX" 
      ? parseFloat(course.priceUSD || "0") 
      : parseFloat(course.priceINR);

    if (isNaN(baseAmount) || baseAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid course price" },
        { status: 400 }
      );
    }

    // Initialize pricing variables
    const originalPrice = baseAmount;
    let subtotal = baseAmount;
    let gstAmount = 0;
    let finalAmount = baseAmount;
    let totalDiscountAmount = 0;
    let adminDiscountAmount = 0;
    let jyotishiDiscountAmount = 0;
    let priceAfterAdminDiscount = baseAmount;
    let commissionAmount = 0;
    const appliedCoupons: any[] = [];
    const couponIds: string[] = [];
    let jyotishiId: string | null = null;

    // ✅ HANDLE MULTIPLE COUPONS (comma-separated)
    if (couponCode && couponCode.trim()) {
      // Split by comma and trim whitespace
      const couponCodes = couponCode.split(',').map((code: string) => code.trim().toUpperCase());
      
      console.log('🎫 Processing coupon codes:', couponCodes);

      // Fetch all coupons in one query
      const coupons = await db
        .select({
          id: CouponsTable.id,
          code: CouponsTable.code,
          discountType: CouponsTable.discountType,
          discountValue: CouponsTable.discountValue,
          createdByJyotishiId: CouponsTable.createdByJyotishiId,
          jyotishiRole: UsersTable.role,
          jyotishiName: UsersTable.name,
        })
        .from(CouponsTable)
        .leftJoin(
          UsersTable,
          eq(CouponsTable.createdByJyotishiId, UsersTable.id)
        )
        .where(inArray(CouponsTable.code, couponCodes));

      if (coupons.length === 0) {
        return NextResponse.json(
          { error: "No valid coupons found" },
          { status: 400 }
        );
      }

      console.log('📋 Found coupons:', coupons.map(c => ({ 
        code: c.code, 
        type: c.jyotishiRole,
        discountType: c.discountType,
        discountValue: c.discountValue
      })));

      // Sort coupons: ADMIN coupons first, then JYOTISHI coupons
      const sortedCoupons = coupons.sort((a, b) => {
        if (a.jyotishiRole === 'ADMIN' && b.jyotishiRole !== 'ADMIN') return -1;
        if (a.jyotishiRole !== 'ADMIN' && b.jyotishiRole === 'ADMIN') return 1;
        return 0;
      });

      // Apply each coupon sequentially
      for (const coupon of sortedCoupons) {
        let discountAmount = 0;
        let baseForDiscount = originalPrice;

        // Determine the base price for this discount
        if (coupon.jyotishiRole === 'JYOTISHI') {
          // Jyotishi discount applies to price after admin discount
          baseForDiscount = priceAfterAdminDiscount;
        }

        // Calculate discount
        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = (baseForDiscount * parseFloat(coupon.discountValue)) / 100;
        } else {
          discountAmount = parseFloat(coupon.discountValue);
        }

        // Ensure discount doesn't exceed base amount
        discountAmount = Math.min(discountAmount, baseForDiscount);

        console.log(`💸 Applied coupon ${coupon.code}:`, {
          type: coupon.jyotishiRole,
          baseForDiscount,
          discountAmount,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        });

        // Track discount amounts by creator type
        if (coupon.jyotishiRole === "JYOTISHI") {
          jyotishiDiscountAmount += discountAmount;
          jyotishiId = coupon.createdByJyotishiId;

          // ✅ FIXED: Calculate commission using course commission rate from DB
          // Commission is calculated on price AFTER admin discount, BEFORE jyotishi discount
          if (courseCommissionRate > 0) {
            commissionAmount = (priceAfterAdminDiscount * courseCommissionRate) / 100;
            
            console.log('💰 Commission calculation:', {
              priceAfterAdminDiscount,
              courseCommissionRate: `${courseCommissionRate}%`,
              commissionAmount,
              jyotishiId
            });
          }
        } else {
          adminDiscountAmount += discountAmount;
          priceAfterAdminDiscount = originalPrice - adminDiscountAmount;
        }

        totalDiscountAmount += discountAmount;
        couponIds.push(coupon.id);

        // Store coupon details
        appliedCoupons.push({
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: Math.round(discountAmount),
          creatorType: coupon.jyotishiRole === "JYOTISHI" ? "JYOTISHI" : "ADMIN",
          creatorName: coupon.jyotishiName
        });
      }

      // Calculate final subtotal after all discounts
      subtotal = originalPrice - totalDiscountAmount;

      console.log('🧮 Final pricing breakdown:', {
        originalPrice,
        adminDiscountAmount,
        priceAfterAdminDiscount,
        jyotishiDiscountAmount,
        totalDiscountAmount,
        subtotal,
        commissionAmount,
        commissionRate: `${courseCommissionRate}%`
      });
    }

    // Apply GST for domestic payments (ONLY on discounted subtotal)
    if (paymentType === "DOMESTIC") {
      gstAmount = subtotal * 0.18;
      finalAmount = subtotal + gstAmount;
    } else {
      finalAmount = subtotal;
    }

    // Ensure final amount is not negative
    if (finalAmount < 0) {
      finalAmount = 0;
    }

    // Generate invoice number
    const year = new Date().getFullYear().toString().slice(-2);
    const nextYear = (parseInt(year) + 1).toString();
    const financialYear = `${year}${nextYear}`;
    const invoiceType = paymentType === "FOREX" ? "F" : "G";

    // Get last invoice number
    const [lastPayment] = await db
      .select({ invoiceNumber: PaymentsTable.invoiceNumber })
      .from(PaymentsTable)
      .where(eq(PaymentsTable.paymentType, paymentType))
      .orderBy(desc(PaymentsTable.createdAt))
      .limit(1);

    let invoiceCounter = 1;
    if (lastPayment?.invoiceNumber) {
      const lastCounter = parseInt(lastPayment.invoiceNumber.slice(-5));
      invoiceCounter = isNaN(lastCounter) ? 1 : lastCounter + 1;
    }

    const invoiceNumber = `FT${financialYear}${invoiceType}${String(
      invoiceCounter
    ).padStart(5, "0")}`;

    // Prepare Razorpay notes with complete billing information
    const razorpayNotes: Record<string, string> = {
      courseId,
      userId,
      coupons: couponCode || '',
      original_price: originalPrice.toString(),
      admin_discount: adminDiscountAmount.toString(),
      jyotishi_discount: jyotishiDiscountAmount.toString(),
      total_discount: totalDiscountAmount.toString(),
      subtotal: subtotal.toString(),
      gst: gstAmount.toString(),
      commission: commissionAmount.toString(),
      commission_rate: courseCommissionRate.toString(),
      gst_number: gstNumber || '',
      invoice_number: invoiceNumber,
    };

    // Add GST legal name if available
    if (gstData?.legalName) {
      razorpayNotes.gst_legal_name = gstData.legalName;
    }
    if (gstData?.tradeName) {
      razorpayNotes.gst_trade_name = gstData.tradeName;
    }

    // Create Razorpay order with the CORRECT discounted amount
    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100), // Convert to paise
      currency: paymentType === "FOREX" ? "USD" : "INR",
      receipt: invoiceNumber,
      notes: razorpayNotes
    });

    // Create payment record with complete billing information
    const [payment] = await db
      .insert(PaymentsTable)
      .values({
        userId,
        invoiceNumber,
        paymentType,
        amount: originalPrice.toString(),
        currency: paymentType === "FOREX" ? "USD" : "INR",
        gstAmount: gstAmount.toString(),
        discountAmount: totalDiscountAmount.toString(),
        finalAmount: finalAmount.toString(),
        couponId: couponIds.length > 0 ? couponIds[0] : null,
        jyotishiId: jyotishiId,
        commissionAmount: commissionAmount.toString(),
        razorpayOrderId: order.id,
        status: "PENDING",
        billingAddress: billingAddress ? JSON.stringify(billingAddress) : null, // ✅ Save billing address
      })
      .returning();

    console.log('✅ Payment created successfully:', {
      paymentId: payment.id,
      invoiceNumber,
      finalAmount,
      commissionAmount,
      commissionRate: `${courseCommissionRate}%`,
      appliedCoupons: appliedCoupons.map(c => c.code),
      billingAddress: billingAddress ? 'Saved' : 'None',
      gstNumber: gstNumber || 'None',
      gstData: gstData ? 'Available' : 'None'
    });

    return NextResponse.json(
      {
        orderId: order.id,
        amount: finalAmount,
        currency: paymentType === "FOREX" ? "USD" : "INR",
        invoiceNumber,
        paymentId: payment.id,
        commission: commissionAmount > 0 ? commissionAmount : null,
        commissionRate: courseCommissionRate,
        discount: totalDiscountAmount,
        adminDiscount: adminDiscountAmount,
        jyotishiDiscount: jyotishiDiscountAmount,
        priceAfterAdminDiscount,
        subtotal: subtotal,
        gstAmount: gstAmount,
        appliedCoupons,
        gstSaved: !!gstNumber, // Indicate if GST data was saved
        addressSaved: !!billingAddress || !!gstData // Indicate if address was saved
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Payment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}