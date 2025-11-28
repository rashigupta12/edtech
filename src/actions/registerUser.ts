/*eslint-disable  @typescript-eslint/no-explicit-any*/
"use server";

import { generateEmailVerificationToken } from "@/lib/token";
import { RegisterUserSchema } from "@/validaton-schema";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createUser, findUserByEmail } from "./user";
import nodemailer from "nodemailer";

// Nodemailer transporter (same as your payment email logic)
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

// ⭐ Futuretek Email Verification Template
function createVerificationEmail(name: string, url: string) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .button { background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
      .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Email Verification ✔️</h1>
        <p>Activate your Futuretek account</p>
      </div>

      <div class="content">
        <h2>Hello ${name || "User"},</h2>
        <p>Thank you for registering with <strong>Futuretek</strong>.</p>
        <p>To activate your account, please click the button below:</p>

        <a href="${url}" class="button">Verify Email</a>

        <p>If the button doesn’t work, copy and paste this link in your browser:</p>
        <p style="word-break: break-all;">
          <strong>${url}</strong>
        </p>

        <p>This link is valid for only a short time.</p>
      </div>

      <div class="footer">
        <p>Welcome to Futuretek! 🚀</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Function to send Futuretek email
async function sendVerificationEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"Futuretek" <${process.env.MAIL_USERNAME}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Email sending failed:", error);
    return { success: false, error: error.message };
  }
}

export async function registerUser(values: z.infer<typeof RegisterUserSchema>) {
  const validation = RegisterUserSchema.safeParse(values);
  if (!validation.success) {
    return { error: "Invalid fields!" };
  }

  const { email, name, password, mobile, role } = validation.data;

  const existingUser = await findUserByEmail(email!);
  if (existingUser) {
    return { error: "User with this email already exists!" };
  }

  const hashedPassword = await bcrypt.hash(password!, 10);
  await createUser({
    name,
    email,
    password: hashedPassword,
    mobile,
    role: role || "USER",
  });

  const verificationToken = await generateEmailVerificationToken(email);
  if (!verificationToken) {
    return { error: "Some error occurred!" };
  }

  const emailVerificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_ENDPOINT}`;
  const finalUrl = `${emailVerificationUrl}?token=${verificationToken.token}`;

  const html = createVerificationEmail(name, finalUrl);

  const emailResult = await sendVerificationEmail(
    verificationToken.email,
    "Verify your Futuretek Account",
    html
  );

  if (!emailResult.success) {
    return { error: "Failed to send verification email!" };
  }

  return {
    success: "User created successfully and verification email sent!",
  };
}
