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

function createVerificationEmail(name: string, url: string) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { 
        background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
        color: white; 
        padding: 30px; 
        text-align: center; 
        border-radius: 10px 10px 0 0; 
      }
      .content { background: #f5f8ff; padding: 30px; border-radius: 0 0 10px 10px; }
      .verify-box { 
        background: white; 
        padding: 20px; 
        border-radius: 8px; 
        margin: 20px 0; 
        border-left: 4px solid #3b82f6; 
      }
      .button { 
        background: #2563eb; 
        color: white; 
        padding: 12px 30px; 
        text-decoration: none; 
        border-radius: 6px; 
        font-weight: 600;
        display: inline-block; 
      }
      .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Email Verification</h1>
        <p>Welcome to EduLearn LMS</p>
      </div>

      <div class="content">
        <h2>Hello ${name || "Learner"},</h2>
        <p>Thank you for registering with <strong>EdTech LMS</strong> — your learning journey starts here!</p>
        <p>Please verify your email address to activate your learning account and access your courses.</p>

        <div class="verify-box">
          <p>Click the button below to confirm your email:</p>
          <a href="${url}" class="button">Verify Email</a>
        </div>

        <p>If the button doesn't work, simply copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #2563eb;">
          ${url}
        </p>

        <p>If you didn't sign up for this account, please ignore this email.</p>
      </div>

      <div class="footer">
        <p>Happy Learning 🎓<br/>The EdTech LMS Team</p>
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

export async function loginUser(
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null
) {
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

    // 🔥 Use callbackUrl if provided, otherwise use DEFAULT_LOGIN_REDIRECT
    const redirectTo = callbackUrl || DEFAULT_LOGIN_REDIRECT;
    
    return { 
      success: "Logged in successfully!", 
      redirectTo 
    };
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