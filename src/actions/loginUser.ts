// loginUser.ts
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import * as z from "zod";
import { findUserByEmail } from "./user";
import { LoginSchema } from "@/validaton-schema";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { generateEmailVerificationToken } from "@/lib/token";
import nodemailer from "nodemailer";

// 🔹 Futuretek email transporter (same as payment route)
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

// 🔹 Futuretek Email Verification Template
function createVerificationEmail(name: string, url: string) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { 
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white; 
        padding: 30px; 
        text-align: center; 
        border-radius: 10px 10px 0 0; 
      }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .verify-box { 
        background: white; 
        padding: 20px; 
        border-radius: 8px; 
        margin: 20px 0; 
        border-left: 4px solid #4facfe; 
      }
      .button { 
        background: #4facfe; 
        color: white; 
        padding: 12px 30px; 
        text-decoration: none; 
        border-radius: 5px; 
        display: inline-block; 
      }
      .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Email Verification Required</h1>
        <p>Secure your Futuretek account</p>
      </div>

      <div class="content">
        <h2>Hello ${name || "User"},</h2>
        <p>Thank you for signing up with <strong>Futuretek</strong>!</p>
        <p>Please verify your email address to activate your account.</p>

        <div class="verify-box">
          <p>Click the button below to verify your email:</p>
          <a href="${url}" class="button">Verify Email</a>
        </div>

        <p>If the button doesn't work, copy and paste this link:</p>
        <p style="word-break: break-all; color: #4facfe;">
          ${url}
        </p>

        <p>If you didn’t create this account, you can safely ignore this email.</p>
      </div>

      <div class="footer">
        <p>Happy Learning!<br>The Futuretek Team</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

// 🔹 For sending email directly
async function sendEmailDirectly(to: string, subject: string, html: string) {
  return await transporter.sendMail({
    from: `"Futuretek" <${process.env.MAIL_USERNAME}>`,
    to,
    subject,
    html,
  });
}

export async function loginUser(values: z.infer<typeof LoginSchema>) {
  const validation = LoginSchema.safeParse(values);

  if (!validation.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validation.data;
  const existingUser = await findUserByEmail(email);

  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  // 🔥 Send branded Futuretek verification email
  if (!existingUser.emailVerified) {
    const verificationToken = await generateEmailVerificationToken(existingUser.email);

    if (verificationToken) {
      const emailVerificationUrl =
        `${process.env.NEXT_PUBLIC_BASE_URL}${process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_ENDPOINT}?token=${verificationToken.token}`;

      const html = createVerificationEmail(existingUser.name, emailVerificationUrl);

      await sendEmailDirectly(
        existingUser.email,
        "Verify Your Futuretek Account",
        html
      );

      return { success: "Verification email sent! Please check your inbox." };
    }
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Invalid credentials!" };
    }

    return { success: "Logged in successfully!", redirectTo: DEFAULT_LOGIN_REDIRECT };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    return { error: "An unexpected error occurred." };
  }
}
