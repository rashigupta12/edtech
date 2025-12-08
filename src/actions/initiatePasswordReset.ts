"use server";

import { sendEmail } from "@/lib/mailer";
import { generatePasswordResetToken } from "@/lib/token";
import { z } from "zod";
import { findUserByEmail } from "./user";
import { ForgotPasswordSchema } from "@/validaton-schema";

// --- FutureTek Email Template ---
// --- LMS / EdTech Email Template ---
const emailTemplate = (
  title: string,
  message: string,
  buttonText: string,
  url: string
) => `
  <div style="font-family: Arial, sans-serif; background:#eef3ff; padding: 40px 0;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">

      <!-- Header -->
      <div style="background: #3b82f6; padding: 22px; text-align: center; color: #fff;">
        <h2 style="margin:0; font-size:24px; font-weight:700;">Edtech Portal</h2>
        <p style="margin:0; font-size:14px;">Your Learning. Your Progress.</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px;">
        <h3 style="margin-top:0; color:#222;">${title}</h3>
        <p style="color:#555; font-size:15px; line-height:1.7;">
          ${message}
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${url}" 
             style="background:#2563eb; color:#fff; padding:12px 22px; text-decoration:none; 
                    border-radius:6px; font-size:16px; display:inline-block; font-weight:600;">
            ${buttonText}
          </a>
        </div>

        <p style="color:#888; font-size:13px; text-align:center; line-height:1.6;">
          If you did not request this action, please ignore this email.<br />
          For any difficulty, reach out to our support team.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8f8f8; padding:18px; text-align:center; color:#666; font-size:12px;">
        © ${new Date().getFullYear()} Edtech LMS. All Rights Reserved.<br/>
        This is an automated message — please do not reply.
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
