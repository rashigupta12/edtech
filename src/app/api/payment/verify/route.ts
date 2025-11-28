/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any*/
/* eslint-disable @typescript-eslint/no-unused-vars*/
// app/api/payment/verify/route.ts
import { eq } from 'drizzle-orm';
import { db } from "@/db";
import { CommissionsTable, CouponsTable, CoursesTable, EnrollmentsTable, PaymentsTable, UsersTable } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth';
import { sendInvoiceEmail } from '@/lib/invoiceEmail';
import nodemailer from 'nodemailer';

// Create email transporter for other emails (course details, zoom)
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

// Course Details Email Template
function createCourseDetailsEmail(courseTitle: string, courseDescription: string, studentName: string, duration?: string, instructor?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .course-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4facfe; }
        .features { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
        .feature-item { background: #e3f2fd; padding: 10px; border-radius: 5px; text-align: center; }
        .button { background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${courseTitle}! 📚</h1>
          <p>Get ready to start your learning journey</p>
        </div>
        <div class="content">
          <h2>Hello ${studentName},</h2>
          <p>Congratulations on enrolling in <strong>${courseTitle}</strong>! We're excited to have you onboard.</p>
          
          <div class="course-info">
            <h3>Course Overview</h3>
            <p>${courseDescription}</p>
            
            <div class="features">
              <div class="feature-item">
                <strong>Duration</strong><br>
                ${duration || 'Self-paced'}
              </div>
              <div class="feature-item">
                <strong>Instructor</strong><br>
                ${instructor || 'Expert Instructor'}
              </div>
              <div class="feature-item">
                <strong>Format</strong><br>
                Live + Recorded
              </div>
              <div class="feature-item">
                <strong>Certificate</strong><br>
                Included
              </div>
            </div>
          </div>

          <h3>What's Next?</h3>
          <ul>
            <li>Access course materials from your dashboard</li>
            <li>Join live sessions as per schedule</li>
            <li>Complete assignments and projects</li>
            <li>Get your completion certificate</li>
          </ul>

          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/user/courses" class="button">Start Learning Now</a>
        </div>
        <div class="footer">
          <p>Happy Learning!<br>The Futuretek Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Zoom Details Email Template
function createZoomDetailsEmail(courseTitle: string, studentName: string, zoomLink?: string, schedule?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .zoom-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #11998e; }
        .tips { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Live Session Details 🎥</h1>
          <p>Join your ${courseTitle} live sessions</p>
        </div>
        <div class="content">
          <h2>Hello ${studentName},</h2>
          <p>Here are the details for your live Zoom sessions for <strong>${courseTitle}</strong>.</p>
          
          <div class="zoom-info">
            <h3>Session Information</h3>
            ${zoomLink ? `
              <p><strong>Zoom Link:</strong> 
                <a href="${zoomLink}" style="color: #11998e; word-break: break-all;">${zoomLink}</a>
              </p>
            ` : '<p><strong>Zoom Link:</strong> Will be shared before each session</p>'}
            
            ${schedule ? `
              <p><strong>Schedule:</strong> ${schedule}</p>
            ` : '<p><strong>Schedule:</strong> Flexible timing - check your dashboard for updates</p>'}
            
            <p><strong>Meeting ID:</strong> Will be provided before each session</p>
          </div>

          <div class="tips">
            <h4>📝 Preparation Tips:</h4>
            <ul>
              <li>Test your audio and video before joining</li>
              <li>Join 5 minutes early to ensure everything works</li>
              <li>Have a stable internet connection</li>
              <li>Use headphones for better audio quality</li>
              <li>Prepare questions in advance</li>
            </ul>
          </div>

          ${zoomLink ? `
            <a href="${zoomLink}" class="button">Join Zoom Meeting</a>
          ` : `
            <p>Zoom links will be available in your dashboard before each session.</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/user/courses" class="button">Go to Dashboard</a>
          `}
        </div>
        <div class="footer">
          <p>See you in class!<br>The Futuretek Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email sending helper function
async function sendEmailDirectly(to: string, subject: string, html: string) {
  try {
    const mailOptions = {
      from: `"Futuretek" <${process.env.MAIL_USERNAME}>`,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', to);
    console.log('📧 Message ID:', result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function POST(req: NextRequest) {
  let paymentId: string | null = null;
  let userId: string | null = null;
  let courseId: string | null = null;

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId: incomingPaymentId,
      courseId: incomingCourseId,
    } = await req.json();

    paymentId = incomingPaymentId;
    courseId = incomingCourseId;

    // Early validation of required fields
    if (!paymentId || !courseId) {
      return NextResponse.json(
        { error: "Payment ID and Course ID are required" },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay key secret not configured');
      return NextResponse.json(
        { error: "Payment gateway configuration error" },
        { status: 500 }
      );
    }

    const session = await auth();
    userId = session?.user?.id || null;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: User not logged in" },
        { status: 401 }
      );
    }

    // Step 1: Check if payment is already verified
    const [existingPayment] = await db
      .select()
      .from(PaymentsTable)
      .where(eq(PaymentsTable.id, paymentId))
      .limit(1);

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    // If payment is already completed, return success
    if (existingPayment.status === "COMPLETED" && existingPayment.enrollmentId) {
      console.log('Payment already verified, returning existing enrollment');
      
      const [existingEnrollment] = await db
        .select()
        .from(EnrollmentsTable)
        .where(eq(EnrollmentsTable.id, existingPayment.enrollmentId))
        .limit(1);

      return NextResponse.json(
        {
          success: true,
          message: "Payment already verified",
          enrollment: existingEnrollment,
          paymentId: paymentId
        },
        { status: 200 }
      );
    }

    // Step 2: Verify Razorpay signature
    const crypto = require("crypto");
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error('Invalid payment signature');

      await db
        .update(PaymentsTable)
        .set({
          status: "FAILED",
          updatedAt: new Date(),
          razorpaySignature: razorpay_signature,
        })
        .where(eq(PaymentsTable.id, paymentId));

      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Step 3: Get course and user details (WITH commission rate)
    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, courseId))
      .limit(1);

    if (!course) {
      await db
        .update(PaymentsTable)
        .set({
          status: "FAILED",
          updatedAt: new Date(),
        })
        .where(eq(PaymentsTable.id, paymentId));

      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    const [user] = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.id, userId))
      .limit(1);

    if (!user) {
      await db
        .update(PaymentsTable)
        .set({
          status: "FAILED",
          updatedAt: new Date(),
        })
        .where(eq(PaymentsTable.id, paymentId));

      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Get course commission rate from database
    const courseCommissionRate = parseFloat(course.commissionPercourse || "0");

    // Step 4: Start database transaction
    let enrollment;
    
    try {
      // Update payment status first
      await db
        .update(PaymentsTable)
        .set({
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "COMPLETED",
          updatedAt: new Date(),
        })
        .where(eq(PaymentsTable.id, paymentId));

      // Create enrollment
      [enrollment] = await db
        .insert(EnrollmentsTable)
        .values({
          userId: userId,
          courseId: courseId,
          status: "ACTIVE",
        })
        .returning();

      // Update enrollment in payment
      await db
        .update(PaymentsTable)
        .set({ enrollmentId: enrollment.id })
        .where(eq(PaymentsTable.id, paymentId));

      // Update course enrollment count
      await db.execute(
        sql`UPDATE ${CoursesTable} SET current_enrollments = current_enrollments + 1 WHERE id = ${courseId}`
      );

      // Handle coupon usage and commission
      if (existingPayment.couponId) {
        await db.execute(
          sql`UPDATE ${CouponsTable} SET current_usage_count = current_usage_count + 1 WHERE id = ${existingPayment.couponId}`
        );

        if (existingPayment.jyotishiId && parseFloat(existingPayment.commissionAmount) > 0) {
          const [jyotishi] = await db
            .select({ 
              name: UsersTable.name,
              role: UsersTable.role 
            })
            .from(UsersTable)
            .where(eq(UsersTable.id, existingPayment.jyotishiId))
            .limit(1);

          if (jyotishi?.role === "JYOTISHI") {
            // ✅ FIXED: Use course commission rate from database, not user's rate
            // The commission was already calculated correctly in create-order
            // We just need to store it with the course commission rate as snapshot
            
            console.log('💰 Creating commission record:', {
              jyotishiId: existingPayment.jyotishiId,
              courseCommissionRate: `${courseCommissionRate}%`,
              commissionAmount: existingPayment.commissionAmount,
              saleAmount: existingPayment.finalAmount
            });

            await db.insert(CommissionsTable).values({
              jyotishiId: existingPayment.jyotishiId,
              paymentId: existingPayment.id,
              courseId: courseId,
              studentId: userId,
              couponId: existingPayment.couponId,
              commissionRate: courseCommissionRate.toString(), // ✅ Use course rate
              saleAmount: existingPayment.finalAmount,
              commissionAmount: existingPayment.commissionAmount, // Already calculated correctly
              status: "PENDING",
            });

            console.log('✅ Commission created for Jyotishi with course rate:', `${courseCommissionRate}%`);
          }
        }
      }

    } catch (dbError) {
      console.error('Database transaction failed:', dbError);
      
      await db
        .update(PaymentsTable)
        .set({
          status: "FAILED",
          updatedAt: new Date(),
        })
        .where(eq(PaymentsTable.id, paymentId));

      throw new Error('Failed to create enrollment and update records');
    }

    // Step 5: Send emails (non-blocking)
    if (user.email) {
      // Get updated payment record with all details
      const [updatedPayment] = await db
        .select()
        .from(PaymentsTable)
        .where(eq(PaymentsTable.id, paymentId))
        .limit(1);

      sendEmailsAfterPayment(user, course, updatedPayment, enrollment.id)
        .catch(emailError => {
          console.error('Email sending failed but payment was successful:', emailError);
        });
    }

    console.log('✅ Payment verification completed successfully');

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully",
        enrollment,
        paymentId: paymentId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Payment verification error:", error);

    if (paymentId) {
      try {
        await db
          .update(PaymentsTable)
          .set({
            status: "FAILED",
            updatedAt: new Date(),
          })
          .where(eq(PaymentsTable.id, paymentId));
      } catch (dbError) {
        console.error('Failed to update payment status to FAILED:', dbError);
      }
    }

    return NextResponse.json(
      { 
        error: "Failed to verify payment",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Separate function for email sending (non-blocking)
async function sendEmailsAfterPayment(user: any, course: any, payment: any, enrollmentId: string) {
  try {
    console.log('📧 Starting email sending process to:', user.email);

    // 1. Send invoice email with PDF attachment (highest priority)
    const invoiceResult = await sendInvoiceEmail({
      payment,
      user,
      course,
    });

    if (invoiceResult.success) {
      console.log('✅ Invoice email sent successfully');
    } else {
      console.error('❌ Invoice email failed:', invoiceResult.error);
    }

    // 2. Send course details email
    const courseEmailHtml = createCourseDetailsEmail(
      course.title,
      course.description || 'An amazing learning experience',
      user.name || 'Student',
      course.duration,
      course.instructor
    );

    const courseEmailResult = await sendEmailDirectly(
      user.email, 
      `Welcome to ${course.title} - Course Details`, 
      courseEmailHtml
    );

    if (courseEmailResult.success) {
      console.log('✅ Course details email sent successfully');
    } else {
      console.error('❌ Course details email failed:', courseEmailResult.error);
    }

    // 3. Send zoom details email
    const zoomEmailHtml = createZoomDetailsEmail(
      course.title,
      user.name || 'Student',
      course.zoomLink,
      course.schedule
    );

    const zoomEmailResult = await sendEmailDirectly(
      user.email, 
      `Live Session Details - ${course.title}`, 
      zoomEmailHtml
    );

    if (zoomEmailResult.success) {
      console.log('✅ Zoom details email sent successfully');
    } else {
      console.error('❌ Zoom details email failed:', zoomEmailResult.error);
    }

    console.log('📊 Email sending process completed');

  } catch (error) {
    console.error('❌ Error in email sending process:', error);
    throw error;
  }
}