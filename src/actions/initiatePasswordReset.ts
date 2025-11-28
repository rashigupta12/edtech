"use server";

import { sendEmail } from "@/lib/mailer";
import { generatePasswordResetToken } from "@/lib/token";
import { z } from "zod";
import { findUserByEmail } from "./user";
import { ForgotPasswordSchema } from "@/validaton-schema";

// --- FutureTek Email Template ---
const emailTemplate = (
  title: string,
  message: string,
  buttonText: string,
  url: string
) => `
  <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding: 40px 0;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden;">

      <!-- Header -->
      <div style="background: #0d6efd; padding: 20px; text-align: center; color: #fff;">
        <h2 style="margin:0; font-size:24px; font-weight:700;">FutureTek</h2>
        <p style="margin:0; font-size:14px;">Empowering Your Digital Future</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px;">
        <h3 style="margin-top:0; color:#333;">${title}</h3>
        <p style="color:#555; font-size:15px; line-height:1.6;">
          ${message}
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" 
             style="background:#0d6efd; color:#fff; padding:12px 20px; text-decoration:none; 
                    border-radius:5px; font-size:16px; display:inline-block;">
            ${buttonText}
          </a>
        </div>

        <p style="color:#888; font-size:13px; text-align:center;">
          If you didn't request this action, you can safely ignore this email.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f1f1f1; padding:15px; text-align:center; color:#666; font-size:12px;">
        © ${new Date().getFullYear()} FutureTek. All rights reserved.<br />
        This is an automated message, do not reply.
      </div>

    </div>
  </div>
`;

// --- MAIN FUNCTION ---
export async function initiatePasswordReset(
  values: z.infer<typeof ForgotPasswordSchema>
) {
  const validation = ForgotPasswordSchema.safeParse(values);
  if (!validation.success) {
    return { error: "Invalid email!" } as const;
  }

  const { email } = validation.data;

  const existingUser = await findUserByEmail(email);
  if (!existingUser) {
    return { error: "Email not found!" } as const;
  }

  const passwordResetToken = await generatePasswordResetToken(email);
  if (!passwordResetToken) {
    return { error: "Email not sent!" } as const;
  }

  const resetPasswordUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${process.env.NEXT_PUBLIC_RESET_PASSWORD_ENDPOINT}`;
  const url = `${resetPasswordUrl}?token=${passwordResetToken.token}`;

  // Send beautifully formatted FutureTek email
  await sendEmail(
    "FutureTek",
    passwordResetToken.email,
    "Reset your password",
    emailTemplate(
      "Reset Your Password",
      "We received a request to reset your password. Click the button below to continue.",
      "Reset Password",
      url
    )
  );

  return { success: "Reset email sent!" } as const;
}
