// =====================================================
// JYOTISHI API ROUTES WITH EMAIL NOTIFICATION
// =====================================================
/*eslint-disable @typescript-eslint/no-require-imports*/
/*eslint-disable  @typescript-eslint/no-unused-vars */
import { db } from "@/db";
import {
  CommissionsTable,
  UsersTable
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from 'nodemailer';

// =====================================================
// EMAIL CONFIGURATION
// =====================================================

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

// =====================================================
// EMAIL TEMPLATES
// =====================================================

function createJyotishiWelcomeEmail(
  name: string,
  email: string,
  password: string,
  jyotishiCode: string,
  commissionRate: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .welcome-text {
          font-size: 18px;
          color: #333;
          margin-bottom: 20px;
        }
        .credentials-box {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
          border-left: 4px solid #667eea;
        }
        .credentials-box h3 {
          margin: 0 0 15px 0;
          color: #667eea;
          font-size: 18px;
        }
        .credential-item {
          background: white;
          padding: 12px 15px;
          margin: 10px 0;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .credential-label {
          font-weight: 600;
          color: #555;
          font-size: 14px;
        }
        .credential-value {
          font-family: 'Courier New', monospace;
          color: #667eea;
          font-weight: 700;
          font-size: 15px;
          background: #f0f4ff;
          padding: 6px 12px;
          border-radius: 4px;
        }
        .info-box {
          background: #fff9e6;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
          border-left: 4px solid #ffc107;
        }
        .info-box h4 {
          margin: 0 0 10px 0;
          color: #f57c00;
          font-size: 16px;
        }
        .info-box ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .info-box li {
          margin: 8px 0;
          color: #666;
        }
        .commission-highlight {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
          text-align: center;
          border: 2px solid #4caf50;
        }
        .commission-highlight h3 {
          margin: 0 0 10px 0;
          color: #2e7d32;
          font-size: 16px;
        }
        .commission-rate {
          font-size: 36px;
          font-weight: 700;
          color: #4caf50;
          margin: 10px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 14px 35px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
          box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(102, 126, 234, 0.4);
        }
        .security-note {
          background: #ffebee;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #f44336;
        }
        .security-note strong {
          color: #c62828;
        }
        .footer {
          background: #f8f9fa;
          padding: 25px 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
          border-top: 1px solid #e0e0e0;
        }
        .footer p {
          margin: 5px 0;
        }
        .logo {
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 5px;
        }
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #ddd, transparent);
          margin: 25px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Futuretek!</h1>
          <p>Your Jyotishi Account Has Been Created</p>
        </div>
        
        <div class="content">
          <p class="welcome-text">
            <strong>Hello ${name},</strong>
          </p>
          <p>
            We're excited to have you join the Futuretek team as a Jyotishi! Your account has been successfully created and is ready to use.
          </p>

          <div class="credentials-box">
            <h3>🔐 Your Login Credentials</h3>
            <div class="credential-item">
              <span class="credential-label">Email Address:</span>
              <span class="credential-value">${email}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Password:</span>
              <span class="credential-value">${password}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Jyotishi Code:</span>
              <span class="credential-value">${jyotishiCode}</span>
            </div>
          </div>

          <div class="security-note">
            <strong>🔒 Important Security Note:</strong> Please change your password immediately after your first login for security purposes. Never share your credentials with anyone.
          </div>

          <div class="commission-highlight">
            <h3>💰 Your Commission Rate</h3>
            <div class="commission-rate">${commissionRate}%</div>
            <p style="color: #555; margin: 5px 0;">
              Earn commission on every course sale through your referrals!
            </p>
          </div>

          <div class="divider"></div>

          <div class="info-box">
            <h4>📋 What You Can Do:</h4>
            <ul>
              <li>View and manage your assigned courses</li>
              <li>Track your commission earnings in real-time</li>
              <li>Generate and share personalized coupon codes</li>
              <li>Monitor your student enrollments</li>
              <li>Access detailed sales reports and analytics</li>
              <li>Manage your bank account details for payouts</li>
            </ul>
          </div>

          <div class="info-box">
            <h4>🚀 Getting Started:</h4>
            <ul>
              <li>Log in to your dashboard using the credentials above</li>
              <li>Complete your profile information</li>
              <li>Update your bank details for commission payouts</li>
              <li>Start sharing your unique coupon codes</li>
              <li>Track your earnings and performance</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/auth/login" class="button">
              Login to Your Dashboard
            </a>
          </div>

          <div class="divider"></div>

          <p style="color: #666; font-size: 14px; line-height: 1.8;">
            <strong>Need Help?</strong><br>
            If you have any questions or need assistance, please don't hesitate to contact our support team. We're here to help you succeed!
          </p>
        </div>

        <div class="footer">
          <div class="logo">Futuretek</div>
          <p>Empowering Astrology Education</p>
          <p style="margin-top: 15px;">
            © ${new Date().getFullYear()} Futuretek. All rights reserved.
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 10px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email sending function
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

// =====================================================
// 1. ADMIN - JYOTISHI MANAGEMENT
// =====================================================

// GET - List all Jyotishi
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isActiveParam = searchParams.get("isActive");

    // Build conditions array
    const conditions = [eq(UsersTable.role, "JYOTISHI")];

    if (isActiveParam !== null) {
      const isActive = isActiveParam === "true";
      conditions.push(eq(UsersTable.isActive, isActive));
    }

    // Single query with all conditions
    const jyotishis = await db
      .select({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        mobile: UsersTable.mobile,
        commissionRate: UsersTable.commissionRate,
        isActive: UsersTable.isActive,
        createdAt: UsersTable.createdAt,
      })
      .from(UsersTable)
      .where(and(...conditions));

    // Get commission stats for each Jyotishi
    const jyotishisWithStats = await Promise.all(
      jyotishis.map(async (jyotishi) => {
        const [stats] = await db
          .select({
            totalCommission: sql<number>`COALESCE(SUM(${CommissionsTable.commissionAmount}), 0)`,
            pendingCommission: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status} = 'PENDING' THEN ${CommissionsTable.commissionAmount} ELSE 0 END), 0)`,
            paidCommission: sql<number>`COALESCE(SUM(CASE WHEN ${CommissionsTable.status} = 'PAID' THEN ${CommissionsTable.commissionAmount} ELSE 0 END), 0)`,
            totalSales: sql<number>`COUNT(*)`,
          })
          .from(CommissionsTable)
          .where(eq(CommissionsTable.jyotishiId, jyotishi.id));

        return {
          ...jyotishi,
          stats: {
            totalCommission: Number(stats.totalCommission),
            pendingCommission: Number(stats.pendingCommission),
            paidCommission: Number(stats.paidCommission),
            totalSales: Number(stats.totalSales),
          },
        };
      })
    );

    return NextResponse.json(
      { jyotishis: jyotishisWithStats },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching jyotishis:", error);
    return NextResponse.json(
      { error: "Failed to fetch jyotishis" },
      { status: 500 }
    );
  }
}

// POST - Create Jyotishi account
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      mobile,
      jyotishiCode,
      commissionRate,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      bankName,
      bankBranchName,
      cancelledChequeImage,
      panNumber,
      bio,
    } = body;

    // Validate required fields
    if (!name || !email || !password || !jyotishiCode || !commissionRate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existingUser] = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Check if Jyotishi code already exists
    const [existingCode] = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.jyotishiCode, jyotishiCode))
      .limit(1);

    if (existingCode) {
      return NextResponse.json(
        { error: "Jyotishi code already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Jyotishi account
    const [jyotishi] = await db
      .insert(UsersTable)
      .values({
        name,
        email,
        password: hashedPassword,
        mobile,
        role: "JYOTISHI",
        jyotishiCode,
        commissionRate,
        bankAccountNumber,
        bankIfscCode,
        bankAccountHolderName,
        bankName,
        bankBranchName,
        cancelledChequeImage,
        panNumber,
        isActive: true,
        updatedAt: new Date(),
      })
      .returning();

    // Send welcome email with credentials (non-blocking)
    sendJyotishiWelcomeEmail(
      name,
      email,
      password, // Send plain password in email (only this once)
      jyotishiCode,
      commissionRate
    ).catch((emailError) => {
      console.error('Failed to send welcome email to Jyotishi:', emailError);
      // Don't fail the account creation if email fails
    });

    // Remove password from response
    const { password: _, ...jyotishiData } = jyotishi;

    return NextResponse.json(
      {
        message: "Jyotishi account created successfully. Welcome email sent.",
        jyotishi: jyotishiData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating jyotishi:", error);
    return NextResponse.json(
      { error: "Failed to create jyotishi account" },
      { status: 500 }
    );
  }
}

// Separate function for sending welcome email (non-blocking)
async function sendJyotishiWelcomeEmail(
  name: string,
  email: string,
  password: string,
  jyotishiCode: string,
  commissionRate: string
) {
  try {
    console.log('📧 Sending welcome email to new Jyotishi:', email);

    const emailHtml = createJyotishiWelcomeEmail(
      name,
      email,
      password,
      jyotishiCode,
      commissionRate
    );

    const result = await sendEmailDirectly(
      email,
      '🎉 Welcome to Futuretek - Your Jyotishi Account Details',
      emailHtml
    );

    if (result.success) {
      console.log('✅ Welcome email sent successfully to:', email);
    } else {
      console.error('❌ Failed to send welcome email:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error in welcome email sending process:', error);
    throw error;
  }
}